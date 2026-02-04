import { Router, type Request, type Response } from "express";
import {
  syncCoursesFromRedi,
  syncParticipantsForCourse,
  syncAll,
  getSyncStatus,
} from "../services/sync.js";
import { query } from "../db.js";
import { isRediSyncConfigured } from "../services/redi-api.js";
import { validateUUID } from "../middleware/validate.js";

export const syncRouter = Router();

syncRouter.post("/courses", async (_req: Request, res: Response) => {
  if (!isRediSyncConfigured()) {
    res.status(503).json({
      success: false,
      error: "REdI integration not configured. Set REDI_EVENT_AVAILABILITY_URL and REDI_PARTICIPANT_LOOKUP_URL environment variables.",
    });
    return;
  }

  try {
    const result = await syncCoursesFromRedi();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Course sync failed:", err);
    res.status(500).json({
      success: false,
      error: "An internal error occurred",
    });
  }
});

syncRouter.post(
  "/participants/:courseId",
  validateUUID("courseId"),
  async (req: Request<{ courseId: string }>, res: Response) => {
    if (!isRediSyncConfigured()) {
      res.status(503).json({
        success: false,
        error: "REdI integration not configured. Set REDI_EVENT_AVAILABILITY_URL and REDI_PARTICIPANT_LOOKUP_URL environment variables.",
      });
      return;
    }

    try {
      const { courseId } = req.params;

      const courseRow = await query<{ redi_event_id: number | null }>(
        `SELECT redi_event_id FROM courses WHERE course_id = $1`,
        [courseId]
      );

      if (courseRow.rows.length === 0) {
        res.status(404).json({ success: false, error: "Course not found" });
        return;
      }

      const rediEventId = courseRow.rows[0]!.redi_event_id;
      if (!rediEventId) {
        res.status(400).json({
          success: false,
          error: "Course has no REdI event ID",
        });
        return;
      }

      const result = await syncParticipantsForCourse(courseId, rediEventId);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("Participant sync failed:", err);
      res.status(500).json({
        success: false,
        error: "An internal error occurred",
      });
    }
  }
);

syncRouter.post("/all", async (_req: Request, res: Response) => {
  if (!isRediSyncConfigured()) {
    res.status(503).json({
      success: false,
      error: "REdI integration not configured. Set REDI_EVENT_AVAILABILITY_URL and REDI_PARTICIPANT_LOOKUP_URL environment variables.",
    });
    return;
  }

  try {
    const result = await syncAll();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Full sync failed:", err);
    res.status(500).json({
      success: false,
      error: "An internal error occurred",
    });
  }
});

syncRouter.get("/status", (_req: Request, res: Response) => {
  res.json(getSyncStatus());
});
