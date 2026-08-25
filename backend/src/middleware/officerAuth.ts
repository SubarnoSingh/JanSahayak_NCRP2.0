import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface OfficerPayload {
  sub: string;
  email: string;
  name: string;
  rank: string;
  unit: string;
}

export function signOfficerToken(payload: OfficerPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "8h" });
}

export function requireOfficer(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Officer authentication required." } });
    return;
  }
  try {
    (req as Request & { officer?: OfficerPayload }).officer = jwt.verify(token, config.jwtSecret) as OfficerPayload;
    next();
  } catch {
    res.status(401).json({ error: { code: "TOKEN_EXPIRED", message: "Session expired. Please sign in again." } });
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[api:error]", err?.message ?? err);
  res.status(500).json({
    error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again in a moment." },
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "The requested service was not found." } });
};
