/**
 * Speech-to-text service.
 *
 * Provider resolution (WHISPER_PROVIDER):
 *  - "openai"   → OpenAI Audio API (/audio/transcriptions) using OPENAI_API_KEY. No separate key.
 *  - "external" → any Whisper-compatible endpoint via WHISPER_API_URL (+ optional WHISPER_API_KEY).
 *  - "off"      → disabled server-side.
 *  - "auto"     → OpenAI if a key exists, else external URL, else browser-only.
 *
 * Primary zero-cost path remains the browser Web Speech API (client-side dictation);
 * this service is the server-side fallback for uploaded audio.
 */
import { config, whisperEffectiveProvider } from "../config";
import type { IncomingFile } from "../middleware/upload";

export interface TranscriptionResult {
  ok: boolean;
  text?: string;
  language?: string;
  reason?: string;
}

const BROWSER_ONLY_REASON =
  "Server speech recognition is not configured in this environment. Use in-browser voice input (supported in Chromium browsers), or type your description.";

export async function transcribeAudio(file: IncomingFile, language = "hi"): Promise<TranscriptionResult> {
  const provider = whisperEffectiveProvider();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    switch (provider) {
      case "openai":
        return await transcribeWithOpenAI(file, language, controller.signal);
      case "external":
        return await transcribeWithExternal(file, language, controller.signal);
      default:
        return { ok: false, reason: BROWSER_ONLY_REASON };
    }
  } catch {
    return { ok: false, reason: "Speech recognition service could not be reached." };
  } finally {
    clearTimeout(timeout);
  }
}

/** OpenAI Whisper — reuses OPENAI_API_KEY; never requires a second credential. */
async function transcribeWithOpenAI(
  file: IncomingFile,
  language: string,
  signal: AbortSignal
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append("file", new Blob([file.buffer]), file.originalname || "audio.webm");
  form.append("model", "whisper-1");
  form.append("language", language);
  const res = await fetch(`${config.openai.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.openai.apiKey}` },
    body: form,
    signal,
  });
  if (!res.ok) {
    console.error(`[speech] OpenAI transcription failed with status ${res.status}.`);
    return { ok: false, reason: `Speech provider returned ${res.status}.` };
  }
  const data = (await res.json()) as { text?: string };
  return { ok: true, text: data.text ?? "", language };
}

/** Generic Whisper-compatible endpoint (self-hosted or third party). */
async function transcribeWithExternal(
  file: IncomingFile,
  language: string,
  signal: AbortSignal
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append("file", new Blob([file.buffer]), file.originalname || "audio.webm");
  form.append("model", "whisper-1");
  form.append("language", language);
  const res = await fetch(config.whisper.apiUrl, {
    method: "POST",
    headers: config.whisper.apiKey ? { Authorization: `Bearer ${config.whisper.apiKey}` } : undefined,
    body: form,
    signal,
  });
  if (!res.ok) {
    console.error(`[speech] External Whisper endpoint returned ${res.status}.`);
    return { ok: false, reason: `Speech provider returned ${res.status}.` };
  }
  const data = (await res.json()) as { text?: string };
  return { ok: true, text: data.text ?? "", language };
}
