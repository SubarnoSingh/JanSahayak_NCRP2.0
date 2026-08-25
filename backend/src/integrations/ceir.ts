/**
 * INTEGRATION — CEIR (Central Equipment Identity Register)
 * Simulates IMEI block-request status.
 *
 * Provider selection via CEIR_MODE:
 *  - "mock"       → local demo response with clearly fictional reference (default).
 *  - "production" → posts to CEIR_API_URL and normalizes into the same shape.
 */
import { config } from "../config";

export interface CeirRequestResult {
  mock: boolean;
  requestId: string;
  imeiMasked: string;
  status: "block_request_registered";
  message: string;
}

export async function requestImeiBlock(
  imei: string
): Promise<{ ok: true; result: CeirRequestResult } | { ok: false; error: string }> {
  const digits = imei.replace(/\D/g, "");
  if (digits.length !== 15) return { ok: false, error: "IMEI must be 15 digits." };

  if (config.ceir.mode === "production") {
    try {
      const raw = await postToCeir({ imei: digits });
      if (typeof raw.requestId !== "string") {
        return { ok: false, error: "CEIR response was malformed (missing requestId)." };
      }
      return {
        ok: true,
        result: {
          mock: false,
          requestId: raw.requestId,
          imeiMasked: `${"*".repeat(9)}${digits.slice(-6)}`,
          status: "block_request_registered",
          message: (raw.message as string) ?? "Device block request registered.",
        },
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unreachable";
      console.error(`[ceir] production block request failed: ${detail}`);
      return { ok: false, error: "Device registry is unavailable. Please retry in a moment." };
    }
  }

  // Deterministic demo reference derived from the device itself.
  const requestId = `CEIR-DEMO-${digits.slice(-6)}`;
  return {
    ok: true,
    result: {
      mock: true,
      requestId,
      imeiMasked: `${"*".repeat(9)}${digits.slice(-6)}`,
      status: "block_request_registered",
      message: "SIMULATED — device block request registered with CEIR sandbox.",
    },
  };
}

async function postToCeir(body: unknown): Promise<Record<string, unknown>> {
  if (!config.ceir.apiUrl) {
    throw new Error("CEIR_MODE=production requires CEIR_API_URL.");
  }
  const res = await fetch(`${config.ceir.apiUrl.replace(/\/$/, "")}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`CEIR endpoint returned ${res.status}.`);
  }
  return (await res.json()) as Record<string, unknown>;
}
