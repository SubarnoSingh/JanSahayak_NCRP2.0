/**
 * Heuristic NLU engine — always-available AI fallback provider.
 * Deterministic multilingual keyword + pattern extraction for demo reliability.
 */
import type {
  IncidentCategory,
  ITransaction,
  ISuspectIdentifier,
} from "../models/Incident";

export interface ClassificationResult {
  category: IncidentCategory;
  confidence: number;
}

const CATEGORY_KEYWORDS: Record<IncidentCategory, string[]> = {
  financial_fraud: [
    // English
    "fraud", "scam", "cheated", "money", "payment", "transaction", "transfer",
    "upi", "paytm", "gpay", "phonepe", "bank", "otp", "kyc", "refunded",
    "debit", "credit card", "loan app", "investment", "trading", "crypto",
    "cashback", "lottery", "wallet", "utr", "neft", "imps", "rtgs",
    // Hindi / Hinglish
    "पैसा", "पैसे", "रुपये", "ठगी", "धोखा", "फ्रॉड", "वसूली", "बैंक", "भेजा",
    "paisa", "paise", "rupee", "rupaye", "thagi", "dhoka", "paise kat gaye",
    "paise transfer", "account se", "nikal gaye",
    // Bengali
    "টাকা", "প্রতারণা", // Bengali
    // Tamil
    "பணம்", "மோசடி",
    // Marathi
    "पैसे", "फसवणूक",
    // Telugu
    "డబ్బు", "మోసం",
  ],
  harassment_extortion: [
    "harassment", "harassing", "blackmail", "blackmailing", "extortion",
    "threat", "threatening", "sextortion", "video call", "nude", "morphed",
    "stalking", "abuse", "abusive", "fake profile", "defamation", "troll",
    "उत्पीड़न", "धमकी", "ब्लैकमेल", "परेशान", "अश्लील",
    "utpeedan", "dhamki", "pareshan", "gaali",
    "হয়রানি", "হুমকি",
    "தொந்தரவு", "மிரட்டல்",
    "छळ", "धमकी",
    "వేధింపు", "బెదిరింపు",
  ],
  women_child_safety: [
    "woman", "women", "girl", "child", "minor", "daughter", "son",
    "obscene", "indecent", "molest", "trafficking", "pornography",
    "mahila", "beti", "bachcha", "bacchi", "ladki", "महिला", "बच्चे", "बच्ची", "लड़की",
    "মেয়ে", "শিশু",
    "பெண்", "குழந்தை",
    "मुलगी", "मूल",
    "మహిళ", "పిల్ల",
  ],
  other_cyber_crime: [
    "hack", "hacked", "hacking", "account takeover", "ransomware", "ransom",
    "virus", "malware", "phishing", "spoof", "impersonation", "data leak",
    "identity theft", "email compromise", "website defaced", "ddos",
    "हैक", "हैकिंग", "खाता हैक",
    "হ্যাক",
    "ஹேக்",
    "हॅक",
    "హ్యాకింగ్",
  ],
};

export function classifyIncidentHeuristic(text: string): ClassificationResult {
  const lower = text.toLowerCase();
  const scores: Record<IncidentCategory, number> = {
    financial_fraud: 0,
    harassment_extortion: 0,
    women_child_safety: 0,
    other_cyber_crime: 0,
  };
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [
    IncidentCategory,
    string[]
  ][]) {
    for (const w of words) if (lower.includes(w)) scores[cat] += 1;
  }
  // Strong signals
  if (/(\d{12})\b/.test(lower) && scores.financial_fraud > 0) scores.financial_fraud += 2;
  if (/₹|\brs\.?\s*\d|upi\s*(id|pay)|@ok|@pay|@ybl/i.test(lower)) scores.financial_fraud += 2;

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  if (!best || best[1] === 0) {
    return { category: "other_cyber_crime", confidence: 0.35 };
  }
  const confidence = Math.min(0.95, 0.55 + (best[1] / Math.max(total, 1)) * 0.4);
  return { category: best[0] as IncidentCategory, confidence: Number(confidence.toFixed(2)) };
}

export interface ExtractionResult {
  transactions: Partial<ITransaction>[];
  suspectIdentifiers: ISuspectIdentifier[];
  amounts: number[];
  detectedLanguageHints: string[];
}

const cleanNumber = (raw: string): number => Number(raw.replace(/[₹,\s]/g, ""));

export function extractStructuredHeuristic(text: string): ExtractionResult {
  const result: ExtractionResult = {
    transactions: [],
    suspectIdentifiers: [],
    amounts: [],
    detectedLanguageHints: [],
  };

  // Amounts: ₹12,000 / Rs 12000 / rupees 12000 / रुपये 12000
  const amountMatches = text.matchAll(
    /(?:₹\s*([\d][\d,]*(?:\.\d{1,2})?))|(?:rs\.?\s*([\d][\d,]*(?:\.\d{1,2})?))|(?:रुपये\s*([\d][\d,]*))|(?:([\d][\d,]*)\s*(?:rupees|rupaye|पैसे))/gi
  );
  for (const m of amountMatches) {
    const raw = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (raw) {
      const n = cleanNumber(raw);
      if (n > 0 && n < 100_000_000) result.amounts.push(n);
    }
  }

  // UTR / RRN: 12-digit number
  const utrMatch = text.match(/\b([1-9]\d{11})\b/);
  if (utrMatch && !/^[6-9]\d{9}$/.test(utrMatch[1])) {
    result.transactions.push({ utr: utrMatch[1], source: "ai_text" });
  }

  // Phone numbers: Indian mobile
  const phones = text.matchAll(/(?:\+91[\s-]?)?\b([6-9]\d{9})\b/g);
  for (const p of phones) {
    result.suspectIdentifiers.push({ type: "phone", value: `+91-${p[1]}`, context: "detected in description" });
  }

  // UPI VPAs
  const vpas = text.matchAll(/\b([\w.-]{2,}@(?:ok(?:axis|hdfcbank|icici|sbi|biz)|paytm|ybl|pay|upi|apl|ibl)\b)/gi);
  for (const v of vpas) {
    result.suspectIdentifiers.push({ type: "upi", value: v[1].toLowerCase(), context: "detected in description" });
  }

  // URLs
  const urls = text.matchAll(/https?:\/\/[^\s]+|(?:www\.)[^\s]+/gi);
  for (const u of urls) {
    result.suspectIdentifiers.push({ type: "url", value: u[0], context: "detected in description" });
  }

  // Emails
  const emails = text.matchAll(/\b([\w.+-]+@[\w-]+\.[\w.]{2,})\b/g);
  for (const e of emails) {
    result.suspectIdentifiers.push({ type: "email", value: e[1].toLowerCase(), context: "detected in description" });
  }

  // Crypto wallets
  const wallets = text.matchAll(/\b(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g);
  for (const w of wallets) {
    result.suspectIdentifiers.push({ type: "wallet", value: w[1], context: "possible crypto wallet" });
  }

  // Social handles
  const handles = text.matchAll(/(?:instagram|insta|fb|facebook|telegram|whatsapp|x)\s*[:\-]?\s*@?([\w.]{3,30})/gi);
  for (const h of handles) {
    result.suspectIdentifiers.push({ type: "social", value: `@${h[1]}`, context: "social handle mentioned" });
  }

  // Merge first transaction's utr with primary amount
  if (result.amounts.length > 0) {
    if (result.transactions.length > 0) {
      result.transactions[0].amount = result.amounts[0];
    } else {
      result.transactions.push({ amount: result.amounts[0], source: "ai_text" });
    }
  }

  // Language hints
  if (/[\u0900-\u097F]/.test(text)) result.detectedLanguageHints.push("hi");
  if (/[\u0980-\u09FF]/.test(text)) result.detectedLanguageHints.push("bn");
  if (/[\u0B80-\u0BFF]/.test(text)) result.detectedLanguageHints.push("ta");
  if (/[\u0C00-\u0C7F]/.test(text)) result.detectedLanguageHints.push("te");
  if (/[\u0C80-\u0CFF]/.test(text)) result.detectedLanguageHints.push("kn");
  if (/[\u0D00-\u0D7F]/.test(text)) result.detectedLanguageHints.push("ml");
  if (/[\u0A80-\u0AFF]/.test(text)) result.detectedLanguageHints.push("gu");
  if (/[\u0A00-\u0A7F]/.test(text)) result.detectedLanguageHints.push("pa");

  return result;
}

/** Parse a bank/SMS-style transaction message deterministically. */
export function parseTransactionSms(smsText: string): Partial<ITransaction> | null {
  const t: Partial<ITransaction> = { source: "sms_parse" };
  const utr = smsText.match(/\b(?:UTR|Ref No|Ref|RRN)[./:\s-]*([1-9]\d{11})\b/i);
  if (utr) t.utr = utr[1];
  const amt = smsText.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (amt) t.amount = cleanNumber(amt[1]);
  const vpa = smsText.match(/\b([\w.-]{2,}@[\w]{2,})\b/);
  if (vpa) t.beneficiaryVpa = vpa[1].toLowerCase();
  const bank = smsText.match(/\b(SBI|HDFC|ICICI|Axis|Kotak|PNB|Yes Bank|IDFC|Bandhan|Union Bank)\b/i);
  if (bank) t.senderBank = bank[1];
  return t.utr || t.amount ? t : null;
}
