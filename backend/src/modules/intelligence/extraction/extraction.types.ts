import { z } from "zod";
import type { NormalizedBoundingBox } from "../ocr/ocr.types.js";

export const EXTRACTOR_VERSION = "phase09-extractor-v1";

// ---------------------------------------------------------------------------
// Field Validation Schemas (Strict Output Invariants)
// ---------------------------------------------------------------------------

export const gstinSchema = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/i, "Invalid GSTIN format");
export const panSchema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid PAN format");
export const udyamSchema = z.string().regex(/^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/i, "Invalid Udyam format");
export const cinSchema = z.string().regex(/^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/i, "Invalid CIN format");
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid ISO date format (YYYY-MM-DD)");

export interface ExtractedFieldResult {
  field: string;
  value: string;
  normalizedValue?: string | undefined;
  page: number;
  boundingBox?: NormalizedBoundingBox | null | undefined;
  confidence: number;
  method: string;
  extractionSource?: string | undefined;
  extractionStatus: "EXTRACTED" | "REVIEW_RECOMMENDED";
}

export interface ExtractionResult {
  fields: ExtractedFieldResult[];
  modelProvider?: string | undefined;
  modelName?: string | undefined;
  modelVersion?: string | undefined;
  pipelineVersion: string;
  extractorVersion: string;
}
