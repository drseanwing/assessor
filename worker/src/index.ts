import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { pool } from "./db.js";
import { syncRouter } from "./routes/sync.js";
import { reportsRouter } from "./routes/reports.js";
import { setupWebSocket } from "./websocket.js";
import { startCronJobs } from "./cron.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
}));
app.use(express.json({ limit: '100kb' }));
app.use(helmet());

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

app.use("/api/sync", syncRouter);
app.use("/api/reports", reportsRouter);

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
