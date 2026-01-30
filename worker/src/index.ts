import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { pool } from "./db.js";
import { syncRouter } from "./routes/sync.js";
import { reportsRouter } from "./routes/reports.js";
import { setupWebSocket } from "./websocket.js";
import { startCronJobs } from "./cron.js";
import { requireAuth } from "./middleware/auth.js";

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

// Protected routes
app.use("/api/sync", requireAuth, syncLimiter, syncRouter);
app.use("/api/reports", requireAuth, reportsLimiter, reportsRouter);

const server = createServer(app);

setupWebSocket(server);
startCronJobs();

server.listen(config.port, () => {
  console.log(`Worker service running on port ${config.port}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  server.close();
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  server.close();
  await pool.end();
  process.exit(0);
});
