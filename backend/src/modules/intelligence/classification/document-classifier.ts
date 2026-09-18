import type { OcrResultData } from "../ocr/ocr.types.js";
import {
  type DocumentClassificationType,
  type ClassificationResult,
  PIPELINE_VERSION,
  CLASSIFIER_VERSION,
} from "./classification.types.js";

interface DocumentRule {
  type: DocumentClassificationType;
  exactPhrases: string[];
  strongKeywords: string[];
  supportingKeywords: string[];
  patterns: RegExp[];
}

const DOCUMENT_RULES: DocumentRule[] = [
  {
    type: "GST_CERTIFICATE",
    exactPhrases: [
      "goods and services tax",
      "registration certificate",
      "form gst reg-06",
      "government of india - goods and services tax",
      "central goods and services tax act",
      "details of additional places of business",
    ],
    strongKeywords: [
      "gstin",
      "taxpayer",
      "principal place of business",
      "date of liability",
      "period of validity",
      "constitution of business",
    ],
    supportingKeywords: [
      "taxable person",
      "proprietorship",
      "private limited",
      "legal name",
      "trade name",
      "arn",
    ],
    patterns: [
      /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/i,
      /\bFORM\s+GST\s+REG-06\b/i,
    ],
  },
  {
    type: "PAN_DOCUMENT",
    exactPhrases: [
      "income tax department",
      "permanent account number",
      "permanent account number card",
      "govt. of india income tax department",
      "government of india income tax department",
    ],
    strongKeywords: [
      "father's name",
      "date of birth",
      "income tax",
      "pan card",
      "pan",
    ],
    supportingKeywords: [
      "signature",
      "photo",
      "deputy commissioner",
      "nsdl",
      "utiitsl",
    ],
    patterns: [
      /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
    ],
  },
  {
    type: "UDYAM_CERTIFICATE",
    exactPhrases: [
      "udyam registration certificate",
      "ministry of micro, small and medium enterprises",
      "msme registration certificate",
      "government of india ministry of msme",
    ],
    strongKeywords: [
      "udyam",
      "enterprise name",
      "major activity",
      "social category",
      "enterprise type",
      "type of enterprise",
      "nic code",
    ],
    supportingKeywords: [
      "micro",
      "small",
      "medium",
      "manufacturing",
      "services",
      "dic",
    ],
    patterns: [
      /\bUDYAM[-/][A-Z]{2}[-/][0-9]{2}[-/][0-9]{7}\b/i,
    ],
  },
  {
    type: "INCORPORATION_CERTIFICATE",
    exactPhrases: [
      "certificate of incorporation",
      "registrar of companies",
      "ministry of corporate affairs",
    ],
    strongKeywords: [
      "corporate identity number",
      "companies act",
      "cin",
      "roc",
    ],
    supportingKeywords: [
      "limited liability",
      "private limited",
      "public limited",
      "seal of the registrar",
    ],
    patterns: [
      /\b[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\b/i,
    ],
  },
  {
    type: "TURNOVER_CERTIFICATE",
    exactPhrases: [
      "turnover certificate",
      "chartered accountants certificate",
      "annual turnover certificate",
      "to whomsoever it may concern",
    ],
    strongKeywords: [
      "chartered accountants",
      "annual turnover",
      "financial year",
      "statutory audit",
      "udin",
    ],
    supportingKeywords: [
      "gross turnover",
      "audited books of accounts",
      "membership number",
      "firm registration",
    ],
    patterns: [
      /\bUDIN\s*[:\-]?\s*[0-9]{2}[0-9]{6}[A-Z0-9]{10}\b/i,
      /\bTURNOVER\b/i,
    ],
  },
  {
    type: "OEM_AUTHORIZATION",
    exactPhrases: [
      "manufacturer authorization form",
      "oem authorization letter",
      "manufacturer's authorization",
      "authorized representative",
    ],
    strongKeywords: [
      "authorized partner",
      "authorized distributor",
      "oem",
      "territory",
      "validity period",
    ],
    supportingKeywords: [
      "warranty support",
      "tender specification",
      "original equipment manufacturer",
    ],
    patterns: [
      /\bOEM\b/i,
      /\bMANUFACTURER['']?S?\s+AUTHORIZATION\b/i,
    ],
  },
  {
    type: "DECLARATION",
    exactPhrases: [
      "make in india declaration",
      "local content declaration",
      "non-blacklisting certificate",
      "self declaration",
    ],
    strongKeywords: [
      "local content percentage",
      "undertaking",
      "debarred",
      "affidavit",
    ],
    supportingKeywords: [
      "solemnly declare",
      "notarized",
      "deponent",
    ],
    patterns: [
      /\bLOCAL\s+CONTENT\b/i,
      /\bMAKE\s+IN\s+INDIA\b/i,
      /\bUNDERTAKING\b/i,
    ],
  },
  {
    type: "TECHNICAL_SPECIFICATION",
    exactPhrases: [
      "technical proposal",
      "technical specification",
      "bill of quantities",
      "compliance sheet",
    ],
    strongKeywords: [
      "specification",
      "datasheet",
      "architecture diagram",
      "methodology",
    ],
    supportingKeywords: [
      "sla",
      "deliverables",
      "milestones",
      "hardware requirement",
    ],
    patterns: [
      /\bTECHNICAL\s+(?:PROPOSAL|SPECIFICATION|BID)\b/i,
    ],
  },
];

export class DocumentClassifier {
  /**
   * Classify OCR output into canonical document types with probabilistic confidence.
   */
  classify(ocrData: OcrResultData, runNumber = 1): ClassificationResult {
    const pages = ocrData.pages;
    const scores = new Map<DocumentClassificationType, number>();

    for (const rule of DOCUMENT_RULES) {
      scores.set(rule.type, 0);
    }

    // Process page by page, applying first-page weight bonus
    pages.forEach((pageResult, index) => {
      const isFirstPage = index === 0;
      const weightMultiplier = isFirstPage ? 1.25 : 1.0;
      const lowerText = pageResult.text.toLowerCase();

      for (const rule of DOCUMENT_RULES) {
        let score = 0;

        // Exact phrases: 1.0 each
        for (const phrase of rule.exactPhrases) {
          if (lowerText.includes(phrase.toLowerCase())) {
            score += 1.0 * weightMultiplier;
          }
        }

        // Strong keywords: 0.5 each
        for (const keyword of rule.strongKeywords) {
          if (lowerText.includes(keyword.toLowerCase())) {
            score += 0.5 * weightMultiplier;
          }
        }

        // Supporting keywords: 0.2 each
        for (const keyword of rule.supportingKeywords) {
          if (lowerText.includes(keyword.toLowerCase())) {
            score += 0.2 * weightMultiplier;
          }
        }

        // Regex pattern matches: 0.8 each
        for (const pattern of rule.patterns) {
          if (pattern.test(pageResult.text)) {
            score += 0.8 * weightMultiplier;
          }
        }

        const current = scores.get(rule.type) || 0;
        scores.set(rule.type, current + score);
      }
    });

    // Find top-scoring category
    let topCategory: DocumentClassificationType = "UNKNOWN";
    let maxScore = 0;

    for (const [type, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        topCategory = type;
      }
    }

    // Normalize confidence between 0.50 and 0.99 for positive matches
    let confidence = 0.5;
    if (maxScore >= 3.0) {
      confidence = 0.98;
    } else if (maxScore >= 2.0) {
      confidence = 0.92;
    } else if (maxScore >= 1.0) {
      confidence = 0.84;
    } else if (maxScore >= 0.5) {
      confidence = 0.65;
    } else {
      topCategory = "UNKNOWN";
      confidence = 0.40;
    }

    return {
      documentType: topCategory,
      confidence: Number(confidence.toFixed(2)),
      method: "RULE_BASED",
      runNumber,
      pipelineVersion: PIPELINE_VERSION,
      classifierVersion: CLASSIFIER_VERSION,
      metadata: {
        rawScore: Number(maxScore.toFixed(2)),
        pageCount: ocrData.pageCount,
      },
    };
  }
}

export const documentClassifier = new DocumentClassifier();
