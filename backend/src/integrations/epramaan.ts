/**
 * INTEGRATION — e-Pramaan / e-sign
 * ------------------------------------------------------------------
 * Aadhaar-based OTP signing. NEVER stores real Aadhaar numbers.
 * Accepts only synthetic-format Virtual IDs (XXXX-XXXX-XXXX) and a demo OTP.
 *
 * Provider selection via EPRAMAAN_MODE:
 *  - "mock"       → local demo challenge/signature (default). Demo hint included.
 *  - "production" → posts to EPRAMAAN_API_URL ({challenge|verify} endpoints).
 */
import crypto from "crypto";
import { config } from "../config";

const DEMO_OTP = "123456";

export interface OtpChallenge {
  mock: boolean;
  challengeId: string;
  maskedVid: string;
  demoHint?: string;
  expiresInSeconds: number;
}

export function maskVirtualId(vid: string): string {
  const digits = vid.replace(/\D/g, "");
  return `XXXX XXXX ${digits.slice(-4).padStart(4, "•")}`;
}

function validateVid(virtualId: string): string | null {
  const digits = virtualId.replace(/\D/g, "");
  if (digits.length !== 12 && digits.length !== 16) {
    return "Enter a valid 12-digit Aadhaar Virtual ID (use any synthetic number for demo).";
  }
  if (digits === "000000000000") return "This identifier is not accepted.";
  return null;
}

export async function createOtpChallenge(virtualId: string): Promise<OtpChallenge | { error: string }> {
  const invalid = validateVid(virtualId);
  if (invalid) return { error: invalid };

  if (config.epramaan.mode === "production") {
    try {
      const raw = await postToEpramaan("/challenge", { virtualId });
      if (typeof raw.challengeId !== "string") {
        return { error: "e-Pramaan challenge response was malformed." };
      }
      return {
        mock: false,
        challengeId: raw.challengeId,
        maskedVid: (raw.maskedVid as string) ?? maskVirtualId(virtualId),
        expiresInSeconds: Number(raw.expiresInSeconds ?? 300),
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unreachable";
      console.error(`[epramaan] production challenge failed: ${detail}`);
      return { error: "Identity service is unavailable. Please retry in a moment." };
    }
  }

  return {
    mock: true,
    challengeId: crypto.randomBytes(8).toString("hex"),
    maskedVid: maskVirtualId(virtualId),
    demoHint: `Demo mode — use OTP ${DEMO_OTP}`,
    expiresInSeconds: 300,
  };
}

export interface SignatureArtifact {
  mock: boolean;
  artifact: string;
  signedHash: string;
  method: string;
}

export async function verifyOtpAndSign(input: {
  challengeId: string;
  otp: string;
  complaintPayloadHash: string;
}): Promise<{ ok: true; artifact: SignatureArtifact } | { ok: false; error: string }> {
  if (!/^\d{6}$/.test(input.otp)) return { ok: false, error: "OTP must be 6 digits." };

  if (config.epramaan.mode === "production") {
    try {
      const raw = await postToEpramaan("/verify", input);
      if (raw.ok !== true || typeof raw.artifact !== "string") {
        return { ok: false, error: (raw.error as string) ?? "OTP verification failed." };
      }
      return {
        ok: true,
        artifact: {
          mock: false,
          artifact: raw.artifact,
          signedHash: input.complaintPayloadHash,
          method: (raw.method as string) ?? "epramaan_production",
        },
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unreachable";
      console.error(`[epramaan] production verify failed: ${detail}`);
      return { ok: false, error: "Identity service is unavailable. Please retry in a moment." };
    }
  }

  if (input.otp !== DEMO_OTP) return { ok: false, error: "Incorrect OTP. For this demo use 123456." };
  const artifact = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${input.challengeId}:${input.complaintPayloadHash}`)
    .digest("hex");
  return {
    ok: true,
    artifact: {
      mock: true,
      artifact,
      signedHash: input.complaintPayloadHash,
      method: "aadhaar_otp_demo (e-Pramaan simulated)",
    },
  };
}

/* ── Production adapter (activated by EPRAMAAN_MODE=production) ────── */

async function postToEpramaan(path: string, body: unknown): Promise<Record<string, unknown>> {
  if (!config.epramaan.apiUrl) {
    throw new Error("EPRAMAAN_MODE=production requires EPRAMAAN_API_URL.");
  }
  const res = await fetch(`${config.epramaan.apiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`e-Pramaan endpoint returned ${res.status}.`);
  }
  return (await res.json()) as Record<string, unknown>;
}
