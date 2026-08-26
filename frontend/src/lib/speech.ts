"use client";

/**
 * SpeechService — browser speech recognition with server-side fallback.
 * Primary: Web Speech API (Chromium; supports hi-IN and other Indic locales).
 * Fallback: MediaRecorder → POST /api/speech/transcribe (backend Whisper proxy).
 */

import { API_URL } from "./api";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export const SPEECH_LOCALE: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
};

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SpeechWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function secureContextSupported(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext;
}

export function mediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== "undefined";
}

export interface VoiceSession {
  stop: () => void;
}

/**
 * Primary path — Web Speech API (Chromium).
 * Returns null only if the constructor is missing or start() throws synchronously.
 * Asynchronous failures (e.g. network) arrive via onError callback.
 */
export function startDictation(
  language: string,
  handlers: {
    onStart?: () => void;
    onPartial?: (text: string) => void;
    onFinalChunk?: (text: string) => void;
    onError?: (code: string, message: string) => void;
    onEnd?: () => void;
  }
): VoiceSession | null {
  const w = window as SpeechWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    handlers.onError?.(
      "unsupported",
      "Voice input isn't supported in this browser. Try Chrome or Edge, or type your description."
    );
    return null;
  }
  const rec = new Ctor();
  rec.lang = SPEECH_LOCALE[language] ?? "en-IN";
  rec.continuous = true;
  rec.interimResults = true;

  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) handlers.onFinalChunk?.(r[0].transcript.trim());
      else interim += r[0].transcript;
    }
    if (interim) handlers.onPartial?.(interim);
  };
  rec.onstart = () => handlers.onStart?.();
  rec.onerror = (event) => {
    const messages: Record<string, string> = {
      "not-allowed": "Microphone permission was denied. Please allow microphone access in your browser settings and try again.",
      "service-not-allowed": "The speech service is unavailable. This can happen if the page is not served over HTTPS. Please type instead, or try Chrome / Edge.",
      "no-speech": "No speech was detected. Please try again.",
      "audio-capture": "No microphone was detected. Please check your microphone is connected and try again.",
      network: "network",
      aborted: "",
      unknown: "An unexpected speech error occurred. Please try again or type your description.",
    };
    const raw = messages[event.error];
    if (!raw) {
      handlers.onError?.(event.error, `Speech error (${event.error}). Please try again or type your description.`);
    } else if (raw === "network") {
      // Pass the code through — caller can decide whether to retry with server fallback
      handlers.onError?.(
        "network",
        "Speech recognition could not connect to the speech service. Trying voice capture instead…"
      );
    } else if (raw) {
      handlers.onError?.(event.error, raw);
    }
  };
  rec.onend = () => handlers.onEnd?.();

  try {
    rec.start();
  } catch {
    handlers.onError?.("start-failed", "Could not start the microphone. Close other apps using it and retry.");
    return null;
  }

  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

/**
 * Fallback path — records audio via MediaRecorder and sends it to the
 * backend Whisper endpoint for transcription.
 */
export async function startMediaRecording(
  language: string,
  handlers: {
    onStart?: () => void;
    onFinalChunk?: (text: string) => void;
    onError?: (code: string, message: string) => void;
    onEnd?: () => void;
  }
): Promise<VoiceSession | null> {
  if (typeof MediaRecorder === "undefined") {
    handlers.onError?.("unsupported", "Audio recording is not supported in this browser.");
    return null;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    handlers.onError?.(
      "not-allowed",
      "Microphone permission was denied. Please allow microphone access in your browser settings and try again."
    );
    return null;
  }

  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  let selectedMime = "";
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime;
      break;
    }
  }

  let recorder: MediaRecorder;
  try {
    recorder = selectedMime
      ? new MediaRecorder(stream, { mimeType: selectedMime })
      : new MediaRecorder(stream);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    handlers.onError?.("recorder-failed", "Could not start audio recording.");
    return null;
  }

  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });

    if (blob.size < 100) {
      handlers.onError?.("no-speech", "No speech was detected. Please try again.");
      handlers.onEnd?.();
      return;
    }

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("language", language);

    try {
      const res = await fetch(`${API_URL}/api/speech/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as {
        ok?: boolean;
        text?: string;
        language?: string;
        error?: { code?: string; message?: string };
        reason?: string;
      };

      if (data.error) {
        handlers.onError?.(
          "transcription-failed",
          data.error.message ?? "Could not convert speech to text. Please try again or type your description."
        );
      } else if (data.text) {
        handlers.onFinalChunk?.(data.text.trim());
      } else {
        handlers.onError?.(
          "transcription-failed",
          "Could not convert speech to text. Please try again or type your description."
        );
      }
    } catch {
      handlers.onError?.(
        "transcription-failed",
        "Could not reach the transcription service. Please try again or type your description."
      );
    } finally {
      handlers.onEnd?.();
    }
  };

  try {
    recorder.start();
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    handlers.onError?.("start-failed", "Could not start audio recording.");
    return null;
  }

  handlers.onStart?.();

  return {
    stop: () => {
      try {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      } catch {
        /* already stopped */
      }
    },
  };
}
