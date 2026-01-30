import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface JwtClaims {
  role: string;
  assessor_id?: string;
  assessor_name?: string;
  iss?: string;
}

declare module "express" {
  interface Request {
    user?: JwtClaims;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as JwtClaims;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
