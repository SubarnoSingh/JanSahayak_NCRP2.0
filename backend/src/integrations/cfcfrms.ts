/**
 * INTEGRATION — CFCFRMS / 1930 helpline
 * ------------------------------------------------------------------
 * Simulates the Citizen Financial Cyber Fraud Reporting & Management System:
 * transaction trace (money trail), bank notification, hold request, freeze.
 *
 * Provider selection via CFCFRMS_MODE:
 *  - "mock"       → deterministic local demo data (default). Clearly labelled
 *                   SIMULATED; nothing outside this file may depend on mock behaviour.
 *  - "production" → posts to CFCFRMS_API_URL ({trace|freeze} endpoints) and
 *                   normalizes the response into the same shapes below.
 *
 * Replace/extend the production adapter internals when official access exists.
 */
import crypto from "crypto";
import { config } from "../config";

const BANKS = ["HDFC Bank", "ICICI Bank", "Axis Bank", "State Bank of India", "Kotak Mahindra", "Punjab National Bank"];

export interface TrailNode {
  id: string;
  label: string;
  bank?: string;
  accountMasked?: string;
  vpa?: string;
  amount?: number;
  at?: string;
  status: string;
}
export interface TrailEdge {
  from: string;
  to: string;
  amount?: number;
  utr?: string;
  channel?: string;
}

export interface TraceResult {
  mock: boolean;
  status: "RECEIVED";
  nodes: TrailNode[];
  edges: TrailEdge[];
}

export interface FreezeResult {
  mock: boolean;
  status: "RECEIVED";
  referenceId: string;
  stage: "bank_notified" | "hold_requested" | "freeze_confirmed";
  bank: string;
  message: string;
  latencyMs: number;
}

/* ── Deterministic PRNG so demo trails are stable for a given case ── */
function seededRandom(seed: string): () => number {
  const hash = crypto.createHash("sha256").update(seed).digest();
  let state = hash.readUInt32BE(0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

function maskAcc(rand: () => number): string {
  return `XXXX XXXX ${Math.floor(1000 + rand() * 9000)}`;
}

/** Trace a defrauded transaction. Mock = synthetic deterministic data only. */
export async function cfcfrmsTraceTransaction(input: {
  utr?: string;
  amount?: number;
  beneficiaryVpa?: string;
}): Promise<TraceResult> {
  if (config.cfcfrms.mode === "production") {
    const raw = await postToCfcfrms("/trace", input);
    return normalizeTrace(raw);
  }

  const seed = `${input.utr ?? "no-utr"}:${input.beneficiaryVpa ?? "no-vpa"}:${input.amount ?? 0}`;
  const rand = seededRandom(seed);
  const amt = input.amount ?? 35000;
  const hop1 = Math.round(amt * 0.6);
  const hop2 = amt - hop1;
  const now = Date.now();
  const t = (mins: number) => new Date(now - mins * 60_000).toISOString();

  return {
    mock: true,
    status: "RECEIVED",
    nodes: [
      { id: "victim", label: "Complainant", status: "source", at: t(180) },
      { id: "mule-a", label: "Beneficiary account", bank: BANKS[Math.floor(rand() * BANKS.length)], accountMasked: maskAcc(rand), vpa: input.beneficiaryVpa ?? undefined, amount: amt, status: "hold_requested", at: t(178) },
      { id: "mule-b", label: "Forwarded transfer", bank: BANKS[Math.floor(rand() * BANKS.length)], accountMasked: maskAcc(rand), amount: hop1, status: "monitoring", at: t(171) },
      { id: "mule-c", label: "Withdrawal attempt", bank: BANKS[Math.floor(rand() * BANKS.length)], accountMasked: maskAcc(rand), amount: hop2, status: "flagged", at: t(165) },
    ],
    edges: [
      { from: "victim", to: "mule-a", amount: amt, utr: input.utr ?? "421598761234", channel: "UPI" },
      { from: "mule-a", to: "mule-b", amount: hop1, channel: "IMPS" },
      { from: "mule-a", to: "mule-c", amount: hop2, channel: "NEFT" },
    ],
  };
}

/** Golden-hour escalation chain against a beneficiary account. */
export async function cfcfrmsRequestFreeze(input: {
  utr?: string;
  amount?: number;
  beneficiaryAccountOrVpa?: string;
}): Promise<FreezeResult> {
  if (config.cfcfrms.mode === "production") {
    const raw = await postToCfcfrms("/freeze", input);
    return normalizeFreeze(raw);
  }

  const seed = `${input.utr ?? "no-utr"}:${input.beneficiaryAccountOrVpa ?? "no-vpa"}`;
  const rand = seededRandom(seed);
  const ref = `CFCFRMS-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const banks = ["Axis Bank", "Paytm Payments Bank", "Airtel Payments Bank"];
  void rand; // freeze reference is intentionally unique per request
  return {
    mock: true,
    status: "RECEIVED",
    referenceId: ref,
    stage: "freeze_confirmed",
    bank: banks[Math.floor(Math.random() * banks.length)],
    message:
      "SIMULATED — In production this triggers CFCFRMS escalation to the beneficiary bank under the 1930 framework.",
    latencyMs: 1200,
  };
}

/* ── Production adapter (activated by CFCFRMS_MODE=production) ─────── */

async function postToCfcfrms(path: string, body: unknown): Promise<Record<string, unknown>> {
  if (!config.cfcfrms.apiUrl) {
    throw new Error("CFCFRMS_MODE=production requires CFCFRMS_API_URL.");
  }
  const res = await fetch(`${config.cfcfrms.apiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`CFCFRMS production endpoint returned ${res.status}.`);
  }
  return (await res.json()) as Record<string, unknown>;
}

function normalizeTrace(raw: Record<string, unknown>): TraceResult {
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    throw new Error("CFCFRMS trace response did not match the expected contract (nodes/edges).");
  }
  return {
    mock: false,
    status: "RECEIVED",
    nodes: raw.nodes as TrailNode[],
    edges: raw.edges as TrailEdge[],
  };
}

function normalizeFreeze(raw: Record<string, unknown>): FreezeResult {
  if (typeof raw.referenceId !== "string") {
    throw new Error("CFCFRMS freeze response did not include a referenceId.");
  }
  return {
    mock: false,
    status: "RECEIVED",
    referenceId: raw.referenceId,
    stage: (raw.stage as FreezeResult["stage"]) ?? "freeze_confirmed",
    bank: (raw.bank as string) ?? "Unknown bank",
    message: (raw.message as string) ?? "Forwarded to CFCFRMS.",
    latencyMs: Number(raw.latencyMs ?? 0),
  };
}
