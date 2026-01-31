import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { assessorId, pin } = req.body;

    if (!assessorId || !pin) {
      res.status(400).json({ success: false, error: "Missing assessorId or pin" });
      return;
    }

    if (typeof pin !== "string" || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ success: false, error: "PIN must be exactly 4 digits" });
      return;
    }

    // Fetch assessor from database
    const result = await pool.query(
      "SELECT assessor_id, name, email, pin_hash, is_active FROM assessors WHERE assessor_id = $1 AND is_active = true",
      [assessorId]
    );

    // Always perform bcrypt comparison to prevent timing attacks
    // Use a real dummy hash if user doesn't exist (bcrypt hash of "00000000")
    const assessor = result.rows[0];
    const hashToCompare = assessor?.pin_hash || "$2a$10$N9qo8uLOickgx2ZMRZoMye.tI1e7lSEIbV3TcWBLLuJ3vESvQPgKC";

    // Compare PIN with bcrypt hash (always runs, even for invalid users)
    const isValid = await bcrypt.compare(pin, hashToCompare);

    // Check if user exists and PIN is valid
    if (!assessor || !isValid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    // Generate a session JWT token for the authenticated assessor
    const token = jwt.sign(
      {
        role: "web_anon",
        assessor_id: assessor.assessor_id,
        assessor_name: assessor.name,
        iss: "redi-assessment"
      },
      config.jwtSecret,
      { algorithm: "HS256", expiresIn: "12h" }
    );

    // Return assessor info (WITHOUT pin_hash) and token
    res.json({
      success: true,
      assessor: {
        assessor_id: assessor.assessor_id,
        name: assessor.name,
        email: assessor.email,
        is_active: assessor.is_active
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

authRouter.get("/assessors", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT assessor_id, name FROM assessors WHERE is_active = true ORDER BY name ASC"
    );
    res.json({ assessors: result.rows });
  } catch (err) {
    console.error("Error fetching assessors:", err);
    res.status(500).json({ error: "Failed to fetch assessors" });
  }
});
