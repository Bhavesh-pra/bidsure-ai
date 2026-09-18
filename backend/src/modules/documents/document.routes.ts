import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { documentController } from "./document.controller.js";
import { intelligenceController } from "../intelligence/intelligence.controller.js";
import { config } from "../../config/env.js";
import { FileValidationError } from "./document.errors.js";

export const documentRoutes = Router({ mergeParams: true });

// Configure Multer with memory storage bounded by authoritative size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.documentMaxSizeBytes,
  },
});

/**
 * Custom Multer upload wrapper:
 * Catches Multer's LIMIT_FILE_SIZE and transforms it into the project's
 * standardized FileValidationError with HTTP 413 REQUEST_TOO_LARGE.
 */
function handleFileUpload(req: Request, res: Response, next: NextFunction): void {
  const uploadSingle = upload.single("file");
  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new FileValidationError(
            "FILE_TOO_LARGE",
            `Document exceeds the maximum permitted upload size of ${config.documentMaxSizeMb} MB.`
          )
        );
      }
      return next(new FileValidationError("UPLOAD_ERROR", err.message || "File upload failed"));
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// Document Ingestion & Lifecycle Routes
// Mounted at: /api/v1/bids/:bidId/documents
// ---------------------------------------------------------------------------

documentRoutes.post("/", handleFileUpload, documentController.upload);
documentRoutes.get("/", documentController.list);
documentRoutes.get("/:documentId", documentController.getById);
documentRoutes.delete("/:documentId", documentController.delete);
documentRoutes.post("/:documentId/retry", documentController.retry);

// ---------------------------------------------------------------------------
// Phase 09 — Intelligence & Evidence Extraction Sub-routes
// ---------------------------------------------------------------------------

documentRoutes.get("/:documentId/intelligence", intelligenceController.getDocumentIntelligence);
documentRoutes.post("/:documentId/process", intelligenceController.processDocument);
