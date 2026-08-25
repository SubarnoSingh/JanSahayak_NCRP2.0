import multer from "multer";
import type { Request } from "express";
import { config } from "../config";
import { mimeAllowed } from "../services/evidenceService";

export interface IncomingFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const ALLOWED_EXT = /\.(png|jpe?g|webp|pdf|txt|csv|docx?|eml|msg|json)$/i;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploads.maxMb * 1024 * 1024, files: 6 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const extOk = ALLOWED_EXT.test(file.originalname);
    if (!mimeAllowed(file.mimetype) && !extOk) {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});

/** Speech uploads accept audio/* only — separate filter so evidence rules stay untouched. */
export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploads.maxMb * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!file.mimetype.startsWith("audio/")) {
      cb(new Error("NOT_AUDIO"));
      return;
    }
    cb(null, true);
  },
});

/** Multer error → friendly API error */
export function uploadErrorHandler(err: unknown, _req: Request, res: import("express").Response, next: import("express").NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: { code: "FILE_TOO_LARGE", message: `Each file must be under ${config.uploads.maxMb} MB.` } });
      return;
    }
    res.status(400).json({ error: { code: err.code, message: "Upload failed. Please try again." } });
    return;
  }
  if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") {
    res.status(415).json({ error: { code: "UNSUPPORTED_FILE_TYPE", message: "This file type isn't supported. Screenshots, PDFs, documents, chat exports (.txt/.eml), and images are accepted." } });
    return;
  }
  if (err instanceof Error && err.message === "NOT_AUDIO") {
    res.status(415).json({ error: { code: "UNSUPPORTED_FILE_TYPE", message: "Only audio recordings are accepted here." } });
    return;
  }
  next(err);
}
