import { createServer } from "node:http";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { syncRouter } from "./routes/sync.js";
import { reportsRouter } from "./routes/reports.js";
import { authMiddleware } from "./middleware/auth.js";
import { setupWebSocket } from "./websocket.js";
import { startCronJobs } from "./cron.js";

const app = express();

// Trust the nginx reverse proxy for correct client IP in rate limiting
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
}));
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/sync", authMiddleware, syncRouter);
app.use("/api/reports", authMiddleware, reportsRouter);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

const server = createServer(app);

setupWebSocket(server);
startCronJobs();

server.listen(config.port, () => {
  console.log(`Worker service running on port ${config.port}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  const forceExit = setTimeout(() => process.exit(1), 10000);
  try {
    server.close();
    await pool.end();
  } catch (err) {
    console.error("Error during shutdown:", err);
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  const forceExit = setTimeout(() => process.exit(1), 10000);
  try {
    server.close();
    await pool.end();
  } catch (err) {
    console.error("Error during shutdown:", err);
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
});
