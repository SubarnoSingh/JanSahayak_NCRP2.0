"use client";

/**
 * SpeechService — browser speech recognition with graceful degradation.
 * Primary: Web Speech API (Chromium; supports hi-IN and other Indic locales).
 * The backend Whisper proxy exists as an alternative path (/api/speech/transcribe).
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
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

export interface VoiceSession {
  stop: () => void;
}

export function startDictation(
  language: string,
  handlers: {
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
  rec.onerror = (event) => {
    const messages: Record<string, string> = {
      "not-allowed": "Microphone access was blocked. Allow microphone permission and try again.",
      "service-not-allowed": "Speech service is unavailable in this browser. Please type instead.",
      "no-speech": "We didn't hear anything. Tap the mic and speak again.",
      network: "Speech recognition needs a network connection. Please check connectivity.",
      aborted: "",
    };
    const msg = messages[event.error];
    if (msg) handlers.onError?.(event.error, msg);
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
