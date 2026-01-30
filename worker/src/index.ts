import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { syncRouter } from "./routes/sync.js";
import { reportsRouter } from "./routes/reports.js";
import { setupWebSocket, getPgListenerClient } from "./websocket.js";
import { startCronJobs } from "./cron.js";
import { requireAuth } from "./middleware/auth.js";

// TODO: Migrate to structured logging with pino
// Current: console.log/error/warn throughout codebase
// Target: JSON-formatted logs with correlation IDs, log levels, timestamps

// Ensure report directory exists
try {
  mkdirSync(config.reportDir, { recursive: true });
} catch {
  console.warn(`Could not create report directory: ${config.reportDir}`);
}

const app = express();

// CORS: only allow specific origin when configured, disable otherwise
app.use(
  cors(
    config.corsOrigin
      ? { origin: config.corsOrigin }
      : { origin: false }
  )
);
app.use(express.json({ limit: "100kb" }));

// Health endpoint (no auth - used by Docker health checks)
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts, please try again later" },
});

const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later" },
});

const reportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later" },
});

// Public auth routes (with rate limiting)
app.use("/api/auth", loginLimiter, authRouter);

// Protected routes
app.use("/api/sync", requireAuth, syncLimiter, syncRouter);
app.use("/api/reports", requireAuth, reportsLimiter, reportsRouter);

const server = createServer(app);

const wss = setupWebSocket(server);
startCronJobs();

server.listen(config.port, () => {
  console.log(`Worker service running on port ${config.port}`);
});

async function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);

  // Close WebSocket server (stops accepting new connections)
  wss.close(() => {
    console.log("WebSocket server closed");
  });

  // Close PG listener
  const pgClient = getPgListenerClient();
  if (pgClient) {
    try {
      pgClient.removeAllListeners();
      await pgClient.end();
      console.log("PG listener closed");
    } catch {
      // Ignore
    }
  }

  // Close HTTP server
  server.close();

  // Close DB pool
  await pool.end();
  console.log("DB pool closed");

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
