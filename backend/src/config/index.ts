import dotenv from "dotenv";
dotenv.config();

const required = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
};

const optional = (name: string): string => process.env[name] ?? "";

/** "true"/"1"/"yes" → true */
const boolEnv = (name: string, fallback = false): boolean => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
};

type IntegrationMode = "mock" | "production";
const modeEnv = (name: string): IntegrationMode =>
  process.env[name]?.toLowerCase() === "production" ? "production" : "mock";

type WhisperProvider = "auto" | "openai" | "external" | "off";
const whisperProviderEnv = (): WhisperProvider => {
  const raw = optional("WHISPER_PROVIDER").toLowerCase();
  if (raw === "openai" || raw === "external" || raw === "off") return raw;
  // "local" is accepted for compatibility: server-local inference is not bundled,
  // so it resolves through auto-detection (OpenAI key → OpenAI, else browser speech).
  return "auto";
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
  mongoUri: required("MONGODB_URI", "mongodb://localhost:27017/ncrp2"),
  openai: {
    apiKey: optional("OPENAI_API_KEY"),
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  },
  whisper: {
    provider: whisperProviderEnv(),
    apiUrl: optional("WHISPER_API_URL"),
    apiKey: optional("WHISPER_API_KEY"),
  },
  bhashini: {
    enabled: boolEnv("BHASHINI_ENABLED", false),
    apiKey: optional("BHASHINI_API_KEY"),
    apiUrl: optional("BHASHINI_API_URL"),
  },
  jwtSecret: required("JWT_SECRET", "ncrp2-local-demo-secret"),
  officerDemo: {
    email: process.env.OFFICER_DEMO_EMAIL ?? "io@ncrp.demo",
    password: process.env.OFFICER_DEMO_PASSWORD ?? "JaiHind2026",
  },
  uploads: {
    dir: process.env.UPLOAD_DIR ?? "uploads",
    maxMb: Number(process.env.MAX_UPLOAD_MB ?? 10),
  },
  /** Government integrations — mock by default; production adapters activate per-mode. */
  cfcfrms: { mode: modeEnv("CFCFRMS_MODE"), apiUrl: optional("CFCFRMS_API_URL") },
  epramaan: { mode: modeEnv("EPRAMAAN_MODE"), apiUrl: optional("EPRAMAAN_API_URL") },
  ceir: { mode: modeEnv("CEIR_MODE"), apiUrl: optional("CEIR_API_URL") },
  tafcop: { mode: modeEnv("TAFCOP_MODE"), apiUrl: optional("TAFCOP_API_URL") },
} as const;

export const isProd = config.nodeEnv === "production";

/** Feature flag: true when a real LLM provider is configured. */
export const aiProviderConfigured = () => Boolean(config.openai.apiKey);

/**
 * Startup environment check.
 * Hard-fails only when values required for ANY operation are absent.
 * Optional providers never crash the server — they degrade with a clear notice.
 */
export function validateEnvironment(): string[] {
  const problems: string[] = [];
  const notices: string[] = [];

  if (!process.env.MONGODB_URI && !config.mongoUri) problems.push("MONGODB_URI is required.");
  if (!config.jwtSecret || config.jwtSecret === "change-me-in-production") {
    if (isProd) problems.push("JWT_SECRET must be changed from the default in production.");
    else notices.push("JWT_SECRET is using the local demo default — fine for development only.");
  }
  if (!config.officerDemo.email || !config.officerDemo.password) {
    problems.push("OFFICER_DEMO_EMAIL and OFFICER_DEMO_PASSWORD are required.");
  }

  if (aiProviderConfigured()) {
    notices.push(`AI provider: OpenAI (${config.openai.model})`);
  } else {
    notices.push("AI provider: OPENAI_API_KEY empty — built-in heuristic engine active (no GPT classification/vision).");
  }
  notices.push(`Speech-to-text: ${whisperEffectiveProvider()}`);
  notices.push(
    config.bhashini.enabled
      ? config.bhashini.apiKey && config.bhashini.apiUrl
        ? "Translation: Bhashini enabled"
        : "Translation: BHASHINI_ENABLED=true but credentials missing — mock provider will be used."
      : "Translation: Bhashini disabled (BHASHINI_ENABLED=false) — built-in mock provider."
  );
  for (const [name, integ] of [
    ["CFCFRMS", config.cfcfrms],
    ["EPRAMAAN", config.epramaan],
    ["CEIR", config.ceir],
    ["TAFCOP", config.tafcop],
  ] as Array<[string, typeof config.cfcfrms]>) {
    if (integ.mode === "production" && !integ.apiUrl) {
      problems.push(`${name}_MODE=production requires ${name}_API_URL to be set.`);
    } else {
      notices.push(`${name}: ${integ.mode} mode${integ.apiUrl ? ` (${integ.apiUrl})` : ""}`);
    }
  }

  for (const n of notices) console.log(`[env] ${n}`);
  if (problems.length > 0) {
    for (const p of problems) console.error(`[env] FATAL: ${p}`);
    throw new Error(`Invalid environment configuration:\n  - ${problems.join("\n  - ")}`);
  }
  return notices;
}

/** Resolves the effective speech-to-text path for the current configuration. */
export function whisperEffectiveProvider(): "openai" | "external" | "browser-only" {
  switch (config.whisper.provider) {
    case "openai":
      return aiProviderConfigured() ? "openai" : "browser-only";
    case "external":
      return config.whisper.apiUrl ? "external" : "browser-only";
    case "off":
      return "browser-only";
    case "auto":
    default:
      if (aiProviderConfigured()) return "openai";
      if (config.whisper.apiUrl) return "external";
      return "browser-only";
  }
}
