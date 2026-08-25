/**
 * Evidence service — storage, integrity verification, privacy scrubbing.
 */
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { config } from "../config";

export function sha256Buffer(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function evidenceHashOk(received: Buffer, clientHash: string): boolean {
  if (!clientHash) return true; // hash optional
  return sha256Buffer(received).toLowerCase() === clientHash.toLowerCase();
}

/**
 * Privacy: strip EXIF/metadata from JPEG (APP1/APP segments) and PNG tEXt chunks.
 * This removes GPS + device metadata before evidence is persisted.
 */
export function scrubImageMetadata(buffer: Buffer, mimeType: string): { buffer: Buffer; scrubbed: boolean } {
  if (mimeType === "image/jpeg") {
    // JPEG structure: FFD8 ... segments FFxx ... SOS
    const out: Buffer[] = [buffer.subarray(0, 2)];
    let i = 2;
    let scrubbed = false;
    while (i < buffer.length - 1) {
      if (buffer[i] !== 0xff) break;
      const marker = buffer[i + 1];
      if (marker === 0xda) {
        // Start of Scan → copy remainder untouched
        out.push(buffer.subarray(i));
        return { buffer: Buffer.concat(out), scrubbed };
      }
      const len = buffer.readUInt16BE(i + 2);
      // APP1 (EXIF/XMP), APP13 (Photoshop IPTC) — drop
      if (marker >= 0xe1 && marker <= 0xed) {
        scrubbed = true;
        i += 2 + len;
        continue;
      }
      out.push(buffer.subarray(i, i + 2 + len));
      i += 2 + len;
    }
    out.push(buffer.subarray(i));
    return { buffer: Buffer.concat(out), scrubbed };
  }

  if (mimeType === "image/png") {
    // Remove tEXt/iTXt/zTXt chunks
    try {
      const chunks: Buffer[] = [];
      let pos = 8;
      chunks.push(buffer.subarray(0, 8));
      let scrubbed = false;
      while (pos + 12 <= buffer.length) {
        const len = buffer.readUInt32BE(pos);
        const type = buffer.toString("ascii", pos + 4, pos + 8);
        const total = 12 + len;
        if (["tEXt", "iTXt", "zTXt", "eXIf"].includes(type)) {
          scrubbed = true;
        } else {
          chunks.push(buffer.subarray(pos, pos + total));
        }
        pos += total;
        if (type === "IEND") break;
      }
      return { buffer: Buffer.concat(chunks), scrubbed };
    } catch {
      return { buffer, scrubbed: false };
    }
  }

  return { buffer, scrubbed: false };
}

export async function persistEvidence(
  incidentId: string,
  originalName: string,
  buffer: Buffer
): Promise<{ storedName: string; absolutePath: string }> {
  const dir = path.resolve(process.cwd(), config.uploads.dir);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(originalName || "").slice(0, 10);
  const storedName = `${incidentId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const absolutePath = path.join(dir, storedName);
  await fs.writeFile(absolutePath, buffer);
  return { storedName, absolutePath };
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "message/rfc822",
  "application/vnd.ms-outlook",
  "application/json",
]);

export function mimeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME.has(mimeType);
}
