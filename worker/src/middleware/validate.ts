import { Request, Response, NextFunction } from "express";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName] as string | undefined;
    if (!value || !UUID_REGEX.test(value)) {
      res.status(400).json({ success: false, error: `Invalid ${paramName} format` });
      return;
    }
    next();
  };
}
