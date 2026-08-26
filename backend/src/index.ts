import express from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import rateLimit from "express-rate-limit";
import { Server as SocketServer } from "socket.io";
import mongoose from "mongoose";
import { config, isProd, validateEnvironment, whisperEffectiveProvider } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/officerAuth";
import { setSocketServer } from "./services/notificationService";
import { autoSeed } from "./services/autoSeed";

async function main(): Promise<void> {
  // Fails fast (with clear messages) only on values required for ANY operation;
  // optional providers are reported, never fatal.
  validateEnvironment();

  await mongoose.connect(config.mongoUri);
  console.log("[api] connected to MongoDB");

  await autoSeed();

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: isProd ? config.corsOrigin : true,
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
    })
  );
  app.use(express.json({ limit: "1mb" }));

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." } },
  });
  app.use("/api", apiLimiter);

  app.get("/healthz", (_req, res) => res.json({ ok: true, service: "ncrp2-api", ts: new Date().toISOString() }));
  app.use("/api", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: { origin: config.corsOrigin, methods: ["GET", "POST"] },
    path: "/ws",
  });
  io.on("connection", (socket) => {
    socket.join("hq");
    console.log(`[ws] client ${socket.id} joined hq`);
    socket.on("incident:subscribe", (ackNumber: string) => {
      if (typeof ackNumber === "string" && /^NCRP-\d{4}-[A-Z0-9]{6}$/.test(ackNumber)) {
        socket.join(`incident:${ackNumber}`);
      }
    });
  });
  setSocketServer(io);

  server.listen(config.port, () => {
    console.log(`[api] NCRP2 API listening on http://localhost:${config.port}`);
    console.log(
      `[api] integrations — AI: ${config.openai.apiKey ? `openai:${config.openai.model}` : "heuristic"} · STT: ${whisperEffectiveProvider()} · Bhashini: ${
        config.bhashini.enabled ? "enabled" : "off (mock)"
      } · CFCFRMS/EPRAMAAN/CEIR/TAFCOP: ${config.cfcfrms.mode}/${config.epramaan.mode}/${config.ceir.mode}/${config.tafcop.mode}`
    );
  });

  const shutdown = async () => {
    await mongoose.connection.close();
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[api] fatal:", err);
  process.exit(1);
});
