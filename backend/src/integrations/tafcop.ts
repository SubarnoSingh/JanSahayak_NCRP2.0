/**
 * INTEGRATION — TAFCOP (Telecom Analytics for Fraud Management and Consumer Protection)
 * Simulates SIM/connection lookup for a mobile number.
 *
 * Provider selection via TAFCOP_MODE:
 *  - "mock"       → fictional demo data only ("Demo Telecom") (default).
 *  - "production" → posts to TAFCOP_API_URL and normalizes into the same shape.
 */
import { config } from "../config";

export interface TafcopConnection {
  number: string;
  operator: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
}

export interface TafcopResult {
  mock: boolean;
  status: "SUCCESS";
  numberMasked: string;
  connectionsFound: number;
  connections: TafcopConnection[];
  message: string;
}

/** Deterministic demo connection list derived from the queried number. */
function mockConnections(digits: string): TafcopConnection[] {
  const tail = digits.slice(-2);
  const count = Number(tail) % 3; // 0–2 connections, stable per number
  const operators = ["Demo Telecom", "Demo Mobile Ltd"];
  return Array.from({ length: count }, (_, i) => ({
    number: `98XXXXXX${Number(tail) + i}`,
    operator: operators[i % operators.length],
    status: "ACTIVE" as const,
  }));
}

export async function lookupConnections(
  phone: string
): Promise<{ ok: true; result: TafcopResult } | { ok: false; error: string }> {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]/.test(digits)) return { ok: false, error: "Enter a valid Indian mobile number." };

  if (config.tafcop.mode === "production") {
    try {
      const raw = await postToTafcop({ phone: digits });
      const connections = Array.isArray(raw.connections) ? (raw.connections as TafcopConnection[]) : [];
      return {
        ok: true,
        result: {
          mock: false,
          status: "SUCCESS",
          numberMasked: `XXXXX XX${digits.slice(-3)}`,
          connectionsFound: connections.length,
          connections,
          message: (raw.message as string) ?? "TAFCOP lookup complete.",
        },
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unreachable";
      console.error(`[tafcop] production lookup failed: ${detail}`);
      return { ok: false, error: "Telecom registry is unavailable. Please retry in a moment." };
    }
  }

  const connections = mockConnections(digits);
  return {
    ok: true,
    result: {
      mock: true,
      status: "SUCCESS",
      numberMasked: `XXXXX XX${digits.slice(-3)}`,
      connectionsFound: connections.length,
      connections,
      message: "SIMULATED — TAFCOP sandbox response. Verify at the official portal.",
    },
  };
}

async function postToTafcop(body: unknown): Promise<Record<string, unknown>> {
  if (!config.tafcop.apiUrl) {
    throw new Error("TAFCOP_MODE=production requires TAFCOP_API_URL.");
  }
  const res = await fetch(`${config.tafcop.apiUrl.replace(/\/$/, "")}/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`TAFCOP endpoint returned ${res.status}.`);
  }
  return (await res.json()) as Record<string, unknown>;
}
