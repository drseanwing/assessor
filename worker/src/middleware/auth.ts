import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
