import { Router, type Request, type Response } from "express";
import {
  generateCourseReport,
  generateAllDailyReports,
  listReports,
} from "../services/report-generator.js";
import { sendReport, sendAllDailyReports } from "../services/email-sender.js";
import { validateUUID } from "../middleware/validate.js";

export const reportsRouter = Router();

reportsRouter.post(
  "/generate/:courseId",
  validateUUID("courseId"),
  async (req: Request<{ courseId: string }>, res: Response) => {
    try {
      const result = await generateCourseReport(req.params.courseId);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("Report generation failed:", err);
      res.status(500).json({
        success: false,
        error: "An internal error occurred",
      });
    }
  }
);

reportsRouter.post(
  "/generate-and-send/:courseId",
  validateUUID("courseId"),
  async (req: Request<{ courseId: string }>, res: Response) => {
    try {
      await sendReport(req.params.courseId);
      res.json({ success: true, message: "Report generated and sent" });
    } catch (err) {
      console.error("Report generation and send failed:", err);
      res.status(500).json({
        success: false,
        error: "An internal error occurred",
      });
    }
  }
);

reportsRouter.post("/daily", async (_req: Request, res: Response) => {
  try {
    const sent = await sendAllDailyReports();
    res.json({ success: true, reportsSent: sent });
  } catch (err) {
    console.error("Daily reports failed:", err);
    res.status(500).json({
      success: false,
      error: "An internal error occurred",
    });
  }
});

reportsRouter.get("/list", async (_req: Request, res: Response) => {
  try {
    const files = await listReports();
    res.json({ success: true, reports: files });
  } catch (err) {
    console.error("Report listing failed:", err);
    res.status(500).json({
      success: false,
      error: "An internal error occurred",
    });
  }
});
