/**
 * Lightweight self-test for provider selection + mock integration logic.
 * No network calls in mock mode; no MongoDB required.
 *
 * Run: npm --prefix backend run selftest
 */
import assert from "node:assert/strict";
import { config, aiProviderConfigured, whisperEffectiveProvider } from "../src/config";
import { lookupConnections } from "../src/integrations/tafcop";
import { requestImeiBlock } from "../src/integrations/ceir";
import { createOtpChallenge, verifyOtpAndSign } from "../src/integrations/epramaan";
import { cfcfrmsTraceTransaction, cfcfrmsRequestFreeze } from "../src/integrations/cfcfrms";
import { translate } from "../src/services/translationService";
import { analyzeIncident } from "../src/services/aiService";

let passed = 0;
const test = async (name: string, fn: () => Promise<void> | void) => {
  await fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

async function main(): Promise<void> {
console.log(`[selftest] modes — CFCFRMS:${config.cfcfrms.mode} EPRAMAAN:${config.epramaan.mode} CEIR:${config.ceir.mode} TAFCOP:${config.tafcop.mode}`);

await test("config: all gov integrations resolve to mock by default", () => {
  if (process.env.CFCFRMS_MODE !== "production") assert.equal(config.cfcfrms.mode, "mock");
  if (process.env.EPRAMAAN_MODE !== "production") assert.equal(config.epramaan.mode, "mock");
  if (process.env.CEIR_MODE !== "production") assert.equal(config.ceir.mode, "mock");
  if (process.env.TAFCOP_MODE !== "production") assert.equal(config.tafcop.mode, "mock");
});

await test("tafcop mock: valid number → fictional demo connections, stable shape", async () => {
  const r = await lookupConnections("+91-9876543210");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.result.status, "SUCCESS");
    assert.equal(r.result.connectionsFound, r.result.connections.length);
    for (const c of r.result.connections) {
      assert.match(c.number, /^98XXXXXX\d{2}$/);
      assert.equal(c.operator.includes("Demo"), true);
      assert.equal(["ACTIVE", "SUSPENDED", "CLOSED"].includes(c.status), true);
    }
    // Determinism
    const again = await lookupConnections("9876543210");
    assert.deepEqual(again.ok ? again.result.connections : [], r.result.connections);
  }
});

await test("tafcop: invalid number rejected without throwing", async () => {
  const r = await lookupConnections("123");
  assert.equal(r.ok, false);
});

await test("ceir mock: 15-digit IMEI → deterministic DEMO reference", async () => {
  const r = await requestImeiBlock("123456789012345");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.result.requestId, "CEIR-DEMO-012345");
    assert.equal(r.result.mock, true);
    assert.match(r.result.imeiMasked, /^\*{9}012345$/);
  }
});

await test("ceir: bad IMEI rejected", async () => {
  const r = await requestImeiBlock("12345");
  assert.equal(r.ok, false);
});

await test("epramaan mock: VID validation → challenge → wrong OTP fails → correct OTP signs", async () => {
  const bad = await createOtpChallenge("123");
  assert.equal("error" in bad && bad.error !== undefined, true);

  const challenge = await createOtpChallenge("234567890123");
  assert.ok(!("error" in challenge));
  if (!("error" in challenge)) {
    assert.match(challenge.maskedVid, /0123$/);
    const wrong = await verifyOtpAndSign({ challengeId: challenge.challengeId, otp: "000000", complaintPayloadHash: "h" });
    assert.equal(wrong.ok, false);
    const right = await verifyOtpAndSign({ challengeId: challenge.challengeId, otp: "123456", complaintPayloadHash: "payload-hash" });
    assert.ok(right.ok);
    // HMAC signature is deterministic for identical inputs
    const right2 = await verifyOtpAndSign({ challengeId: challenge.challengeId, otp: "123456", complaintPayloadHash: "payload-hash" });
    if (right.ok && right2.ok) assert.equal(right2.artifact.artifact, right.artifact.artifact);
  }
});

await test("cfcfrms mock: trace is deterministic per case input and well-shaped", async () => {
  const input = { utr: "421598761234", amount: 35000, beneficiaryVpa: "scammer@okaxis" };
  const a = await cfcfrmsTraceTransaction(input);
  const b = await cfcfrmsTraceTransaction(input);
  assert.equal(a.status, "RECEIVED");
  assert.deepEqual(a.nodes.map((n) => [n.bank, n.accountMasked]), b.nodes.map((n) => [n.bank, n.accountMasked]));
  assert.equal(a.nodes.length, 4);
  assert.equal(a.edges.length, 3);
});

await test("cfcfrms mock: freeze returns reference id + SIMULATED notice", async () => {
  const r = await cfcfrmsRequestFreeze({ utr: "421598761234", amount: 35000, beneficiaryAccountOrVpa: "scammer@okaxis" });
  assert.equal(r.status, "RECEIVED");
  assert.match(r.referenceId, /^CFCFRMS-\d{4}-[0-9A-F]{6}$/);
  assert.match(r.message, /SIMULATED/);
});

await test("translation: BHASHINI_ENABLED=false never touches network; mock phrase translates", async () => {
  if (!config.bhashini.enabled) {
    const known = await translate({ text: "financial fraud", sourceLanguage: "en", targetLanguage: "hi" });
    assert.equal(known.ok, true);
    assert.equal(known.provider, "mock");
    const unknown = await translate({ text: "totally unknown sentence xyzq", sourceLanguage: "en", targetLanguage: "hi" });
    assert.equal(unknown.ok, false);
    assert.equal(unknown.provider, "mock"); // honest failure, no crash
  } else {
    console.log("    (skipped — Bhashini enabled in this environment)");
  }
});

await test("ai service: missing OPENAI key degrades to heuristic without crashing", async () => {
  const analysis = await analyzeIncident(
    "Debited Rs 35000 from A/c XX1234 UTR 421598761234 to scammer.refund@okaxis"
  );
  if (!aiProviderConfigured()) {
    assert.equal(analysis.provider, "heuristic");
    assert.ok(analysis.transactions.length >= 1);
  } else {
    assert.ok(["openai", "heuristic"].includes(analysis.provider));
  }
});

await test("speech provider resolution matches configuration", () => {
  const effective = whisperEffectiveProvider();
  assert.ok(["openai", "external", "browser-only"].includes(effective));
  if (!aiProviderConfigured() && !config.whisper.apiUrl) assert.equal(effective, "browser-only");
});

console.log(`\n[selftest] ${passed} checks passed.`);
}

main().catch((err) => {
  console.error("[selftest] FAILED:", err);
  process.exit(1);
});
