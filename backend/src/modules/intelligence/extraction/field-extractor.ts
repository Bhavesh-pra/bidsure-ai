import type { OcrResultData, OcrPageResult, NormalizedBoundingBox } from "../ocr/ocr.types.js";
import {
  type ExtractedFieldResult,
  type ExtractionResult,
  EXTRACTOR_VERSION,
  gstinSchema,
  panSchema,
  udyamSchema,
  cinSchema,
  isoDateSchema,
} from "./extraction.types.js";
import { PIPELINE_VERSION, type DocumentClassificationType } from "../classification/classification.types.js";

// Regex Patterns
const GSTIN_RE = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/i;
const PAN_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;
const UDYAM_RE = /\bUDYAM[-/][A-Z]{2}[-/][0-9]{2}[-/][0-9]{7}\b/i;
const CIN_RE = /\b[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\b/i;
const DATE_RE = /\b(?:[0-3]?\d)[/-](?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}\b/;
const ISO_DATE_RE = /\b(?:19|20)\d{2}-(?:0?[1-9]|1[0-2])-(?:[0-3]?\d)\b/;
const TURNOVER_RE = /(?:₹|INR|Rs\.?)\s*([0-9,]+(?:\.[0-9]{2})?)\s*(?:Cr(?:ore)?|Lakh|L)?/i;
const UDIN_RE = /\bUDIN\s*[:\-]?\s*([0-9]{2}[0-9]{6}[A-Z0-9]{10})\b/i;

export function normalizeName(val: string): string {
  let cleaned = val.replace(/[^A-Za-z0-9&.\- ]+/g, " ").trim();
  cleaned = cleaned.replace(/\b(PRIVATE|PVT)\.?\s+LIMITED\b/gi, "PVT LTD");
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned.toUpperCase();
}

export function normalizeIdentifier(val: string): string {
  return val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function normalizeDate(val: string): string | null {
  const trimmed = val.trim();
  if (ISO_DATE_RE.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.split(/[/\\-]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0] || "1", 10);
    let month = parseInt(parts[1] || "1", 10);
    let year = parseInt(parts[2] || "2000", 10);
    if (year < 100) year += 2000;
    const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    if (isoDateSchema.safeParse(iso).success) {
      return iso;
    }
  }
  return null;
}

function findBoundingBoxForText(page: OcrPageResult, textSnippet: string): NormalizedBoundingBox | null {
  if (!page.boundingBoxes || page.boundingBoxes.length === 0) return null;
  const target = textSnippet.toLowerCase().trim();
  for (const item of page.boundingBoxes) {
    if (item.text.toLowerCase().includes(target) || target.includes(item.text.toLowerCase())) {
      return item.box;
    }
  }
  return page.boundingBoxes[0]?.box ?? null;
}

function extractLabelValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:${escaped})\\s*[:\\-]?\\s*([^\\n|]+)`, "i");
    const match = regex.exec(text);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val.length > 1) return val;
    }
  }
  return null;
}

export class FieldExtractor {
  extractFields(
    ocrData: OcrResultData,
    documentType: DocumentClassificationType
  ): ExtractionResult {
    const fields: ExtractedFieldResult[] = [];
    const seenFields = new Set<string>();

    const addField = (
      field: string,
      rawValue: string,
      normalizedValue: string | null,
      page: number,
      confidence: number,
      box: NormalizedBoundingBox | null,
      sourceSnippet?: string
    ) => {
      if (seenFields.has(field)) return;
      seenFields.add(field);

      const status = confidence >= 0.7 ? "EXTRACTED" : "REVIEW_RECOMMENDED";
      fields.push({
        field,
        value: rawValue.trim(),
        normalizedValue: normalizedValue ?? rawValue.trim(),
        page,
        boundingBox: box,
        confidence: Number(confidence.toFixed(2)),
        method: "RULE_BASED",
        extractionSource: sourceSnippet ? sourceSnippet.trim() : undefined,
        extractionStatus: status,
      });
    };

    // Iterate through pages in order
    for (const page of ocrData.pages) {
      const text = page.text;
      const pageNum = page.page;

      // 1. GSTIN Extraction
      const gstinMatch = GSTIN_RE.exec(text);
      if (gstinMatch && gstinMatch[0]) {
        const raw = gstinMatch[0].toUpperCase();
        const valid = gstinSchema.safeParse(raw);
        if (valid.success) {
          const box = findBoundingBoxForText(page, raw);
          addField("gstin", raw, normalizeIdentifier(raw), pageNum, 0.98, box, `GSTIN: ${raw}`);
        }
      }

      // 2. PAN Extraction
      const panMatch = PAN_RE.exec(text);
      if (panMatch && panMatch[0]) {
        const raw = panMatch[0].toUpperCase();
        // Avoid treating parts of GSTIN as standalone PAN unless valid PAN document or explicit PAN label
        const isPartOfGstin = gstinMatch && gstinMatch[0].includes(raw);
        if (!isPartOfGstin || documentType === "PAN_DOCUMENT") {
          const valid = panSchema.safeParse(raw);
          if (valid.success) {
            const box = findBoundingBoxForText(page, raw);
            addField("pan", raw, normalizeIdentifier(raw), pageNum, 0.96, box, `PAN: ${raw}`);
          }
        }
      }

      // 3. Udyam Registration Number
      const udyamMatch = UDYAM_RE.exec(text);
      if (udyamMatch && udyamMatch[0]) {
        const raw = udyamMatch[0].replace(/\//g, "-").toUpperCase();
        const valid = udyamSchema.safeParse(raw);
        if (valid.success) {
          const box = findBoundingBoxForText(page, raw);
          addField("udyam_number", raw, raw, pageNum, 0.98, box, `Udyam: ${raw}`);
        }
      }

      // 4. Corporate Identification Number (CIN)
      const cinMatch = CIN_RE.exec(text);
      if (cinMatch && cinMatch[0]) {
        const raw = cinMatch[0].toUpperCase();
        const valid = cinSchema.safeParse(raw);
        if (valid.success) {
          const box = findBoundingBoxForText(page, raw);
          addField("cin", raw, raw, pageNum, 0.97, box, `CIN: ${raw}`);
        }
      }

      // 5. Legal Name
      const legalName = extractLabelValue(text, [
        "Legal Name",
        "Name of Business",
        "Enterprise Name",
        "Name of Enterprise",
        "Company Name",
        "Name of the Company",
        "Name of Assessee",
        "Taxpayer Name",
      ]);
      if (legalName) {
        const norm = normalizeName(legalName);
        const box = findBoundingBoxForText(page, legalName);
        addField("legal_name", legalName, norm, pageNum, 0.94, box, legalName);
      }

      // 6. Trade Name
      const tradeName = extractLabelValue(text, ["Trade Name", "Trade Name of Business"]);
      if (tradeName) {
        const norm = normalizeName(tradeName);
        const box = findBoundingBoxForText(page, tradeName);
        addField("trade_name", tradeName, norm, pageNum, 0.90, box, tradeName);
      }

      // 7. Registration Status
      const regStatus = extractLabelValue(text, ["Status", "Registration Status", "GST Status"]);
      if (regStatus) {
        const upper = regStatus.toUpperCase().trim();
        const box = findBoundingBoxForText(page, regStatus);
        addField("registration_status", regStatus, upper, pageNum, 0.92, box, regStatus);
      }

      // 8. Registration / Incorporation Date
      const regDate = extractLabelValue(text, [
        "Date of Registration",
        "Registration Date",
        "Date of Incorporation",
        "Incorporation Date",
        "Date of Birth",
        "DOB",
      ]);
      if (regDate) {
        const normDate = normalizeDate(regDate);
        const box = findBoundingBoxForText(page, regDate);
        addField("registration_date", regDate, normDate ?? regDate, pageNum, normDate ? 0.90 : 0.65, box, regDate);
      }

      // 9. Enterprise Type
      const entType = extractLabelValue(text, [
        "Type of Enterprise",
        "Enterprise Type",
        "Major Activity",
        "Organisation Type",
        "Organization Type",
        "Constitution of Business",
      ]);
      if (entType) {
        const upper = entType.toUpperCase().trim();
        const box = findBoundingBoxForText(page, entType);
        addField("enterprise_type", entType, upper, pageNum, 0.88, box, entType);
      }

      // 10. Registered Address
      const address = extractLabelValue(text, [
        "Principal Place of Business",
        "Registered Office",
        "Official Address",
        "Registered Address",
        "Address",
      ]);
      if (address) {
        const cleanAddress = address.replace(/\s+/g, " ").trim();
        const box = findBoundingBoxForText(page, address);
        addField("registered_address", address, cleanAddress, pageNum, 0.82, box, cleanAddress);
      }

      // 11. Turnover & Financial Figures
      const turnoverMatch = TURNOVER_RE.exec(text);
      if (turnoverMatch && turnoverMatch[0]) {
        const raw = turnoverMatch[0].trim();
        const box = findBoundingBoxForText(page, raw);
        addField("turnover", raw, raw, pageNum, 0.88, box, raw);
      }

      // 12. UDIN / Certificate Number
      const udinMatch = UDIN_RE.exec(text);
      if (udinMatch && udinMatch[1]) {
        const raw = udinMatch[1].trim();
        const box = findBoundingBoxForText(page, raw);
        addField("certificate_number", raw, raw, pageNum, 0.95, box, `UDIN: ${raw}`);
      }
    }

    return {
      fields,
      modelProvider: "bidsure-deterministic-rules",
      modelName: "rule-extractor",
      modelVersion: "1.0.0",
      pipelineVersion: PIPELINE_VERSION,
      extractorVersion: EXTRACTOR_VERSION,
    };
  }
}

export const fieldExtractor = new FieldExtractor();
