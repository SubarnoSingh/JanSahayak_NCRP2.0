/**
 * Translation service abstraction.
 * Providers:
 *  - Bhashini (only when BHASHINI_ENABLED=true AND key+URL are configured)
 *  - Mock phrase provider (demo) — translates common UI/service phrases
 *
 * BHASHINI_ENABLED=false guarantees zero network calls to Bhashini and no
 * credential-missing errors; the mock provider answers instead.
 *
 * UI localization (frontend dictionaries) is deliberately separate from this
 * AI-facing translation pipeline.
 */
import { config } from "../config";

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResult {
  ok: boolean;
  translatedText?: string;
  provider: "bhashini" | "mock" | "none";
  reason?: string;
}

const MOCK_PHRASES: Record<string, string> = {
  "your complaint has been submitted": "आपकी शिकायत दर्ज कर ली गई है",
  "financial fraud": "वित्तीय धोखाधड़ी",
  "cyber harassment": "साइबर उत्पीड़न",
  "please verify these details": "कृपया इन विवरणों की पुष्टि करें",
};

const bhashiniReady = () =>
  config.bhashini.enabled && Boolean(config.bhashini.apiKey) && Boolean(config.bhashini.apiUrl);

export async function translate(req: TranslationRequest): Promise<TranslationResult> {
  if (req.sourceLanguage === req.targetLanguage) {
    return { ok: true, translatedText: req.text, provider: "none" };
  }
  if (bhashiniReady()) {
    try {
      const res = await fetch(config.bhashini.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.bhashini.apiKey}`,
        },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { translatedText?: string };
        if (data?.translatedText) {
          return { ok: true, translatedText: data.translatedText, provider: "bhashini" };
        }
      }
      console.error(`[translation] Bhashini provider returned ${res.status}.`);
      return { ok: false, provider: "bhashini", reason: "Translation provider error." };
    } catch {
      return { ok: false, provider: "bhashini", reason: "Translation provider unreachable." };
    }
  }
  // Mock provider: exact-phrase demo translation, otherwise honest failure.
  const lower = req.text.toLowerCase().trim();
  if (MOCK_PHRASES[lower]) {
    return { ok: true, translatedText: MOCK_PHRASES[lower], provider: "mock" };
  }
  return {
    ok: false,
    provider: "mock",
    reason: config.bhashini.enabled
      ? "Bhashini credentials are incomplete. Set BHASHINI_API_KEY and BHASHINI_API_URL to enable live translation."
      : "Live translation needs a Bhashini API key (BHASHINI_ENABLED=true). The multilingual UI works via built-in dictionaries; AI processing accepts all Indian languages directly.",
  };
}
