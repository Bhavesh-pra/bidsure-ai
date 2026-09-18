import { RequirementOperator, RequirementCategory } from "@prisma/client";

export interface RuleCatalogItem {
  id: string;
  name: string;
  category: RequirementCategory;
  description: string;
  defaultVersion: number;
  supportedOperators: RequirementOperator[];
  requiredParameters: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "date";
    description: string;
    required: boolean;
  }>;
  expectedEvidenceType: string;
}

export const CONTROLLED_RULE_CATALOG: RuleCatalogItem[] = [
  {
    id: "TURNOVER_MINIMUM",
    name: "Minimum Annual Turnover",
    category: RequirementCategory.TURNOVER,
    description: "Evaluates bidder average or single-year annual turnover against threshold.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.GREATER_THAN_OR_EQUAL,
      RequirementOperator.GREATER_THAN,
    ],
    requiredParameters: [
      { name: "unit", type: "string", description: "Currency unit (e.g. INR)", required: true },
      { name: "financialYears", type: "number", description: "Number of preceding financial years", required: true },
    ],
    expectedEvidenceType: "AUDITED_FINANCIAL_STATEMENT",
  },
  {
    id: "GST_STATUS",
    name: "GST Registration & Active Status",
    category: RequirementCategory.GST_REGISTRATION,
    description: "Checks whether bidder holds valid, active GSTIN registration.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.STATUS_EQUALS,
      RequirementOperator.EQUALS,
    ],
    requiredParameters: [
      { name: "expectedStatus", type: "string", description: "Expected GSTIN status (e.g. Active)", required: true },
    ],
    expectedEvidenceType: "GST_CERTIFICATE",
  },
  {
    id: "UDYAM_STATUS",
    name: "Udyam / MSME Registration Validity",
    category: RequirementCategory.UDYAM_REGISTRATION,
    description: "Validates Udyam registration number and enterprise classification.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.STATUS_EQUALS,
      RequirementOperator.EQUALS,
      RequirementOperator.ONE_OF,
    ],
    requiredParameters: [
      { name: "enterpriseType", type: "string", description: "MICRO, SMALL, or MEDIUM", required: false },
    ],
    expectedEvidenceType: "UDYAM_CERTIFICATE",
  },
  {
    id: "PAN_VALIDITY",
    name: "Permanent Account Number (PAN) Verification",
    category: RequirementCategory.PAN,
    description: "Validates bidder PAN format, authenticity, and legal entity name match.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.STATUS_EQUALS,
      RequirementOperator.EQUALS,
    ],
    requiredParameters: [],
    expectedEvidenceType: "PAN_DOCUMENT",
  },
  {
    id: "INCORPORATION_AGE",
    name: "Minimum Years of Incorporation",
    category: RequirementCategory.LEGAL_ENTITY,
    description: "Validates that the bidder has been incorporated for at least the specified duration.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.GREATER_THAN_OR_EQUAL,
      RequirementOperator.DATE_ON_OR_BEFORE,
    ],
    requiredParameters: [
      { name: "minYears", type: "number", description: "Minimum years of incorporation", required: true },
    ],
    expectedEvidenceType: "CERTIFICATE_OF_INCORPORATION",
  },
  {
    id: "EXPERIENCE_MINIMUM",
    name: "Past Track Record & Technical Experience",
    category: RequirementCategory.EXPERIENCE,
    description: "Evaluates relevant completed projects or years of sector experience.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.GREATER_THAN_OR_EQUAL,
      RequirementOperator.GREATER_THAN,
    ],
    requiredParameters: [
      { name: "minYears", type: "number", description: "Minimum years of relevant experience", required: true },
      { name: "similarProjectsCount", type: "number", description: "Minimum number of similar completed projects", required: false },
    ],
    expectedEvidenceType: "EXPERIENCE_CERTIFICATE",
  },
  {
    id: "OEM_AUTHORIZATION",
    name: "Original Equipment Manufacturer (OEM) Authorization",
    category: RequirementCategory.OEM_AUTHORIZATION,
    description: "Validates submission of valid manufacturer authorization form (MAF).",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.BOOLEAN_TRUE,
      RequirementOperator.EXISTS,
    ],
    requiredParameters: [
      { name: "equipmentCategory", type: "string", description: "Designated equipment or hardware category", required: false },
    ],
    expectedEvidenceType: "OEM_AUTHORIZATION_LETTER",
  },
  {
    id: "EMD_SUBMISSION",
    name: "Earnest Money Deposit (EMD) / Exemption",
    category: RequirementCategory.EMD,
    description: "Evaluates EMD bank guarantee/payment or statutory MSME/Startup exemption.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.BOOLEAN_TRUE,
      RequirementOperator.GREATER_THAN_OR_EQUAL,
    ],
    requiredParameters: [
      { name: "amountINR", type: "number", description: "Mandatory EMD amount in INR", required: false },
      { name: "allowExemption", type: "boolean", description: "Whether MSME/Startup exemption applies", required: true },
    ],
    expectedEvidenceType: "EMD_RECEIPT_OR_DECLARATION",
  },
  {
    id: "CERTIFICATE_VALIDITY",
    name: "Statutory & Technical Certification Validity",
    category: RequirementCategory.CERTIFICATION,
    description: "Validates ISO or technical conformity certification expiration date.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.DATE_AFTER,
      RequirementOperator.BOOLEAN_TRUE,
    ],
    requiredParameters: [
      { name: "standard", type: "string", description: "Certification standard (e.g. ISO 9001, ISO 27001)", required: true },
    ],
    expectedEvidenceType: "COMPLIANCE_CERTIFICATE",
  },
  {
    id: "MANDATORY_DECLARATION",
    name: "Non-Blacklisting & Integrity Declaration",
    category: RequirementCategory.DECLARATION,
    description: "Checks signed affidavit/undertaking on non-debarment and integrity pact.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.BOOLEAN_TRUE,
      RequirementOperator.EXISTS,
    ],
    requiredParameters: [
      { name: "declarationType", type: "string", description: "NON_BLACKLISTING, LOCAL_CONTENT, or INTEGRITY_PACT", required: true },
    ],
    expectedEvidenceType: "SIGNED_DECLARATION",
  },
  {
    id: "EMD_EXEMPTION",
    name: "EMD Exemption / Bank Guarantee",
    category: RequirementCategory.EMD,
    description: "Evaluates EMD bank guarantee or statutory exemption criteria.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.GREATER_THAN_OR_EQUAL,
      RequirementOperator.EXISTS,
      RequirementOperator.BOOLEAN_TRUE,
    ],
    requiredParameters: [],
    expectedEvidenceType: "EMD_RECEIPT_OR_DECLARATION",
  },
  {
    id: "ISO_CERTIFICATION",
    name: "ISO & Quality Standard Certification",
    category: RequirementCategory.CERTIFICATION,
    description: "Evaluates accredited ISO standards (ISO 9001, ISO 27001, etc.).",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.CONTAINS,
      RequirementOperator.EXISTS,
      RequirementOperator.BOOLEAN_TRUE,
    ],
    requiredParameters: [],
    expectedEvidenceType: "COMPLIANCE_CERTIFICATE",
  },
  {
    id: "FINANCIAL_RATIOS",
    name: "Financial Ratios & Solvency Capacity",
    category: RequirementCategory.FINANCIAL_CAPACITY,
    description: "Evaluates net worth, current ratio, and bank solvency letters.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.GREATER_THAN_OR_EQUAL,
      RequirementOperator.GREATER_THAN,
      RequirementOperator.EQUALS,
    ],
    requiredParameters: [],
    expectedEvidenceType: "FINANCIAL_STATEMENT",
  },
  {
    id: "LITIGATION_CLEAR",
    name: "Litigation & Dispute Declaration",
    category: RequirementCategory.DECLARATION,
    description: "Evaluates pending dispute and arbitration history declarations.",
    defaultVersion: 1,
    supportedOperators: [
      RequirementOperator.EQUALS,
      RequirementOperator.BOOLEAN_TRUE,
      RequirementOperator.EXISTS,
    ],
    requiredParameters: [],
    expectedEvidenceType: "SIGNED_DECLARATION",
  },
];

const RULE_ID_SET = new Set(CONTROLLED_RULE_CATALOG.map((r) => r.id));

export function isValidRuleId(ruleId: string): boolean {
  return RULE_ID_SET.has(ruleId);
}

export function getRuleCatalogItem(ruleId: string): RuleCatalogItem | undefined {
  return CONTROLLED_RULE_CATALOG.find((r) => r.id === ruleId);
}

export const getRuleDefinition = getRuleCatalogItem;
