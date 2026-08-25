/**
 * Centralized AI service.
 *
 * Provider pattern:
 *  - OpenAIProvider  → used automatically when OPENAI_API_KEY is set
 *  - HeuristicProvider → deterministic fallback, always available (demo-safe)
 *
 * Guarantees:
 *  - All outputs are structured JSON.
 *  - AI never triggers irreversible action by itself; results are always
 *    surfaced for human confirmation in the UI.
 */
import { config, aiProviderConfigured } from "../config";
import {
  classifyIncidentHeuristic,
  extractStructuredHeuristic,
  parseTransactionSms,
  type ClassificationResult,
  type ExtractionResult,
} from "./heuristicEngine";
import type { IncidentCategory } from "../models/Incident";

export interface IncidentAnalysis {
  category: IncidentCategory;
  categoryConfidence: number;
  provider: "openai" | "heuristic";
  narrativeSummary: string;
  transactions: ExtractionResult["transactions"];
  suspectIdentifiers: ExtractionResult["suspectIdentifiers"];
  languageHints: string[];
}

const CATEGORY_PROMPT_LIST = `financial_fraud | harassment_extortion | women_child_safety | other_cyber_crime`;

async function openaiChat(messages: unknown[], maxTokens = 900): Promise<string | null> {
  if (!aiProviderConfigured()) return null;
  try {
    const res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages,
        temperature: 0.1,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      // Configured provider failing must never be silent — surface it, then degrade.
      const body = await res.text().catch(() => "");
      console.error(
        `[ai] OpenAI request failed (${res.status}). Check OPENAI_API_KEY/credits. Falling back to heuristic engine. ${body.slice(0, 200)}`
      );
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[ai] OpenAI request threw (${detail}). Falling back to heuristic engine.`);
    return null;
  }
}

function summarizeNarrativeHeuristic(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const firstSentences = clean.split(/(?<=[।.!؟?])\s/).slice(0, 3).join(" ");
  return firstSentences.length > 24 ? firstSentences : clean.slice(0, 240);
}

export async function analyzeIncident(
  rawText: string,
  hintCategory?: IncidentCategory
): Promise<IncidentAnalysis> {
  const heuristic = extractStructuredHeuristic(rawText);
  const heuristicClass: ClassificationResult =
    hintCategory && heuristic.amounts.length === 0 && heuristic.suspectIdentifiers.length === 0
      ? { category: hintCategory, confidence: 0.6 }
      : classifyIncidentHeuristic(rawText);

  const content = await openaiChat([
    {
      role: "system",
      content:
        "You are the intake analysis engine for India's National Cyber Crime Reporting Portal. Citizens describe cybercrime incidents in any Indian language, Hinglish or mixed scripts. Return ONLY JSON with keys: category (one of " +
        CATEGORY_PROMPT_LIST +
        "), confidence (0-1), narrative_summary (neutral English summary of facts, max 3 sentences), transactions (array of {utr, amount, currency:'INR', timestamp, senderBank, beneficiaryVpa, method} — omit unknown), suspect_identifiers (array of {type: phone|upi|url|social|email|wallet|ip|other, value, context}). Never invent values not present or strongly implied in the text.",
    },
    { role: "user", content: rawText },
  ]);

  if (content) {
    try {
      const parsed = JSON.parse(content);
      return {
        category: parsed.category ?? heuristicClass.category,
        categoryConfidence: Number(parsed.confidence ?? heuristicClass.confidence),
        provider: "openai",
        narrativeSummary: parsed.narrative_summary || summarizeNarrativeHeuristic(rawText),
        transactions: Array.isArray(parsed.transactions)
          ? parsed.transactions.map((t: Record<string, unknown>) => ({ ...t, source: "ai_text" }))
          : heuristic.transactions,
        suspectIdentifiers: Array.isArray(parsed.suspect_identifiers)
          ? parsed.suspect_identifiers
          : heuristic.suspectIdentifiers,
        languageHints: heuristic.detectedLanguageHints,
      };
    } catch {
      // fall through to heuristic result
    }
  }

  return {
    category: heuristicClass.category,
    categoryConfidence: heuristicClass.confidence,
    provider: "heuristic",
    narrativeSummary: summarizeNarrativeHeuristic(rawText),
    transactions: heuristic.transactions,
    suspectIdentifiers: heuristic.suspectIdentifiers,
    languageHints: heuristic.detectedLanguageHints,
  };
}

export interface VisionExtraction {
  available: boolean;
  reason?: string;
  fields: Partial<{
    utr: string;
    amount: number;
    bank: string;
    beneficiaryVpa: string;
    timestamp: string;
  }>;
  provider: "openai" | "none";
}

/** Vision extraction from evidence screenshots (financial documents). */
export async function extractFromImage(
  base64Image: string,
  mimeType: string
): Promise<VisionExtraction> {
  if (!aiProviderConfigured()) {
    return {
      available: false,
      reason: "Automated screenshot reading requires an AI vision provider. Enter details manually — your complaint is equally valid.",
      fields: {},
      provider: "none",
    };
  }
  const content = await openaiChat(
    [
      {
        role: "system",
        content:
          'You read Indian payment screenshots (UPI apps, bank apps, SMS). Return ONLY JSON: {utr?:string(12 digits), amount?:number, bank?:string, beneficiaryVpa?:string, timestamp?:string}. Only include fields actually visible. Never guess.',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract transaction details from this payment screenshot." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      },
    ],
    400
  );
  if (!content) {
    return { available: false, reason: "Vision extraction failed. Please verify details manually.", fields: {}, provider: "none" };
  }
  try {
    const parsed = JSON.parse(content);
    return { available: true, fields: parsed, provider: "openai" };
  } catch {
    return { available: false, reason: "Could not parse extraction result.", fields: {}, provider: "none" };
  }
}

export { parseTransactionSms };
