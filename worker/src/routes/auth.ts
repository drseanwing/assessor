import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { config } from "../config.js";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/auth.js";

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

interface LoginBody {
  assessorId: string;
  pin: string;
}

authRouter.post("/login", loginLimiter, async (req: Request<object, object, LoginBody>, res: Response) => {
  try {
    const { assessorId, pin } = req.body;

    if (!assessorId || typeof assessorId !== "string") {
      res.status(400).json({ success: false, error: "assessorId is required" });
      return;
    }
    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ success: false, error: "PIN must be 4 digits" });
      return;
    }

    const result = await query(
      "SELECT assessor_id, name, email, pin_hash, is_active FROM assessors WHERE assessor_id = $1 AND is_active = true",
      [assessorId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const assessor = result.rows[0];
    const pinValid = await bcrypt.compare(pin, assessor.pin_hash);

    if (!pinValid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      {
        sub: assessor.assessor_id,
        name: assessor.name,
        role: "assessor",
      },
      config.jwtSecret,
      { expiresIn: "12h" }
    );

    res.json({
      success: true,
      token,
      assessor: {
        assessor_id: assessor.assessor_id,
        name: assessor.name,
        email: assessor.email,
        is_active: assessor.is_active,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

authRouter.get("/assessors", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT assessor_id, name FROM assessors WHERE is_active = true ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching assessors:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export { authRouter };
