import crypto from "node:crypto";
import path from "node:path";
import { config } from "../../config/env.js";
import { FileValidationError } from "./document.errors.js";

export interface ValidatedDocumentFile {
  originalFilename: string;
  sanitizedFilename: string;
  extension: string;
  declaredMimeType: string;
  canonicalMimeType: string;
  sizeBytes: number;
  sha256: string;
  buffer: Buffer;
}

// Magic byte signatures for each supported file type
const MAGIC_BYTES: Record<string, { signature: Buffer; length: number }> = {
  ".pdf": { signature: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]), length: 5 }, // %PDF-
  ".jpg": { signature: Buffer.from([0xff, 0xd8, 0xff]), length: 3 },
  ".jpeg": { signature: Buffer.from([0xff, 0xd8, 0xff]), length: 3 },
  ".png": { signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), length: 8 }, // \x89PNG\r\n\x1a\n
};

// Canonical MIME type output
const CANONICAL_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

// Acceptable browser-reported MIME types
const ALLOWED_MIMES: Record<string, Set<string>> = {
  ".pdf": new Set(["application/pdf", "application/x-pdf"]),
  ".jpg": new Set(["image/jpeg", "image/jpg", "image/pjpeg"]),
  ".jpeg": new Set(["image/jpeg", "image/jpg", "image/pjpeg"]),
  ".png": new Set(["image/png", "image/x-png"]),
};

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

/**
 * Authoritative Server-Side File Validator.
 *
 * Implements strict multi-stage verification:
 *   file existence → empty check → size limit → extension check → MIME check → magic-byte check → SHA-256
 *
 * Untrusted client headers and claims are never trusted alone.
 */
export function validateUploadedFile(file: {
  buffer?: Buffer | undefined;
  originalname?: string | undefined;
  mimetype?: string | undefined;
  size?: number | undefined;
}): ValidatedDocumentFile {
  // 1. File existence
  if (!file || !file.buffer || !file.originalname) {
    throw new FileValidationError("EMPTY_FILE", "No file was provided in the upload request.");
  }

  const buffer = file.buffer;
  const originalFilename = file.originalname;

  // 2. Empty check
  if (buffer.length === 0) {
    throw new FileValidationError("EMPTY_FILE", "The uploaded file is empty (0 bytes).");
  }

  // 3. Authoritative Server-Side Size check (independent of Multer)
  const maxSizeBytes = config.documentMaxSizeBytes;
  if (buffer.length > maxSizeBytes) {
    throw new FileValidationError(
      "FILE_TOO_LARGE",
      `Document exceeds the maximum permitted upload size of ${config.documentMaxSizeMb} MB.`
    );
  }

  // 4. Filename & Path Traversal Neutralization
  const baseName = path.basename(originalFilename).replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!baseName || baseName.includes("..") || baseName.startsWith("/")) {
    throw new FileValidationError("INVALID_FILE_TYPE", "The filename contains invalid characters or path traversal sequences.");
  }

  // 5. Extension check
  const lastDot = baseName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0) {
    throw new FileValidationError(
      "UNSUPPORTED_FILE_TYPE",
      "Unsupported document type. BidSure accepts PDF, JPG and PNG files."
    );
  }

  const extension = baseName.slice(lastDot).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new FileValidationError(
      "UNSUPPORTED_FILE_TYPE",
      "Unsupported document type. BidSure accepts PDF, JPG and PNG files."
    );
  }

  // 6. Declared MIME validation against extension
  const declaredMime = (file.mimetype || "").toLowerCase().trim();
  const allowedMimesForExt = ALLOWED_MIMES[extension];
  if (declaredMime && allowedMimesForExt && !allowedMimesForExt.has(declaredMime)) {
    throw new FileValidationError(
      "UNSUPPORTED_FILE_TYPE",
      `Declared MIME type '${declaredMime}' does not match the expected format for ${extension} files.`
    );
  }

  // 7. Magic-byte (file signature) inspection
  const sigInfo = MAGIC_BYTES[extension];
  if (!sigInfo) {
    throw new FileValidationError("UNSUPPORTED_FILE_TYPE", "Unsupported document type.");
  }

  if (buffer.length < sigInfo.length) {
    throw new FileValidationError(
      "INVALID_FILE_SIGNATURE",
      "The uploaded file is too short to contain a valid file signature."
    );
  }

  const slice = buffer.subarray(0, sigInfo.length);
  if (!slice.equals(sigInfo.signature)) {
    throw new FileValidationError(
      "INVALID_FILE_SIGNATURE",
      "The uploaded file content does not match the expected file format (magic-byte mismatch). The file may be spoofed, corrupted, or renamed."
    );
  }

  // 8. Deterministic SHA-256 calculation
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex").toLowerCase();

  // 9. Canonical MIME assignment
  const canonicalMimeType = CANONICAL_MIME[extension] || "application/octet-stream";

  return {
    originalFilename,
    sanitizedFilename: baseName,
    extension: extension.replace(/^\./, ""),
    declaredMimeType: declaredMime || canonicalMimeType,
    canonicalMimeType,
    sizeBytes: buffer.length,
    sha256,
    buffer,
  };
}
