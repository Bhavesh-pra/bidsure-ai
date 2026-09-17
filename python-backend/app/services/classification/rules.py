"""
Curated Rule Definitions and Taxonomy for Document Classification.

Maintains multi-tiered signal sets (exact phrases, strong keywords, supporting keywords,
regexes, and negative/disambiguation weights) for all 10 canonical document types.
"""

import re
from typing import Any, Dict, List, Pattern
from app.services.classification.document_types import DocumentType

# ---------------------------------------------------------------------------
# Signal Weights
# ---------------------------------------------------------------------------
WEIGHT_EXACT_PHRASE = 1.00
WEIGHT_STRONG_KEYWORD = 0.50
WEIGHT_SUPPORTING_KEYWORD = 0.20
WEIGHT_REGEX_PATTERN = 0.40
WEIGHT_FIRST_PAGE_BONUS = 1.25

# ---------------------------------------------------------------------------
# Compiled Regexes
# ---------------------------------------------------------------------------
REGEX_PATTERNS: Dict[DocumentType, List[Pattern]] = {
    DocumentType.GST_CERTIFICATE: [
        # Standard 15-char GSTIN pattern
        re.compile(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b", re.IGNORECASE),
        re.compile(r"\bFORM\s+GST\s+REG-06\b", re.IGNORECASE),
    ],
    DocumentType.PAN_DOCUMENT: [
        # 10-character PAN format
        re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"),
    ],
    DocumentType.UDYAM_CERTIFICATE: [
        # UDYAM registration number format: UDYAM-XX-00-0000000
        re.compile(r"\bUDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}\b", re.IGNORECASE),
    ],
    DocumentType.INCOME_TAX_DOCUMENT: [
        # ITR Acknowledgement (15 digits)
        re.compile(r"\bITR-[1-7V]\b", re.IGNORECASE),
        re.compile(r"\b[0-9]{15}\b"),
    ],
    DocumentType.FINANCIAL_STATEMENT: [
        # UDIN format: 18 chars (e.g. 21000000AAAAAA0000)
        re.compile(r"\bUDIN\s*[:\-]?\s*[0-9]{2}[0-9]{6}[A-Z0-9]{10}\b", re.IGNORECASE),
    ],
    DocumentType.STARTUP_CERTIFICATE: [
        # DPIIT recognition number format (e.g. DIPP12345 or DPIIT12345)
        re.compile(r"\bDPIIT\d{4,8}\b", re.IGNORECASE),
        re.compile(r"\bDIPP\d{4,8}\b", re.IGNORECASE),
    ],
}

# ---------------------------------------------------------------------------
# Keyword and Phrase Rule Definitions
# ---------------------------------------------------------------------------
DOCUMENT_RULES: Dict[DocumentType, Dict[str, List[str]]] = {
    DocumentType.GST_CERTIFICATE: {
        "exact_phrases": [
            "goods and services tax",
            "registration certificate",
            "form gst reg-06",
            "government of india - goods and services tax",
            "central goods and services tax act",
            "tax registration certificate",
            "details of additional places of business",
        ],
        "strong_keywords": [
            "gstin",
            "taxpayer",
            "principal place of business",
            "date of liability",
            "period of validity",
            "constitution of business",
            "state jurisdiction",
            "centre jurisdiction",
        ],
        "supporting_keywords": [
            "taxable person",
            "proprietorship",
            "private limited company",
            "legal name",
            "trade name",
            "arn",
            "registration number",
        ],
    },
    DocumentType.PAN_DOCUMENT: {
        "exact_phrases": [
            "income tax department",
            "permanent account number",
            "permanent account number card",
            "govt. of india income tax department",
            "government of india income tax department",
            "form no. 49a",
            "nsdl e-governance infrastructure",
            "uti infrastructure technology and services",
        ],
        "strong_keywords": [
            "father's name",
            "fathers name",
            "date of birth",
            "permanent account",
            "taxpayer identification",
            "pan card",
        ],
        "supporting_keywords": [
            "incometax",
            "signature",
            "allotment letter",
            "deputy commissioner of income-tax",
            "income tax pan",
        ],
    },
    DocumentType.UDYAM_CERTIFICATE: {
        "exact_phrases": [
            "udyam registration certificate",
            "ministry of micro, small and medium enterprises",
            "udyam registration number",
            "uam no",
            "msme development act",
            "micro, small and medium enterprises",
        ],
        "strong_keywords": [
            "udyam",
            "msme",
            "micro enterprise",
            "small enterprise",
            "medium enterprise",
            "major activity",
            "enterprise type",
            "services/manufacturing",
        ],
        "supporting_keywords": [
            "date of incorporation",
            "national industry classification",
            "nic 2 digit",
            "dic",
            "social category",
            "dic name",
        ],
    },
    DocumentType.OEM_AUTHORIZATION: {
        "exact_phrases": [
            "manufacturers authorization form",
            "manufacturer authorization form",
            "manufacturer's authorization",
            "oem authorization certificate",
            "oem authorization letter",
            "authorized distributor",
            "we hereby authorize",
            "authorization letter",
            "original equipment manufacturer authorization",
        ],
        "strong_keywords": [
            "original equipment manufacturer",
            "oem",
            "authorized partner",
            "authorized reseller",
            "validity of authorization",
            "tender reference no",
            "tender ref",
            "tender no",
            "bidder name",
        ],
        "supporting_keywords": [
            "warranty support",
            "letter of authority",
            "supply and maintain",
            "back to back warranty",
            "distributor agreement",
            "comprehensive warranty",
        ],
    },
    DocumentType.INCOME_TAX_DOCUMENT: {
        "exact_phrases": [
            "indian income tax return acknowledgement",
            "income tax return verification form",
            "acknowledgement number",
            "assessment year",
            "directorate of income tax (systems)",
            "centralized processing center",
            "income tax return",
        ],
        "strong_keywords": [
            "gross total income",
            "total income",
            "tax payable",
            "e-filing",
            "current year loss",
            "form 26as",
            "self assessment tax",
            "itr-v",
            "itr 1",
            "itr 2",
            "itr 3",
            "itr 4",
            "itr 5",
            "itr 6",
            "itr 7",
        ],
        "supporting_keywords": [
            "filing section",
            "due date",
            "e-verification",
            "computation of income",
            "verified by",
            "advance tax",
            "refund",
        ],
    },
    DocumentType.FINANCIAL_STATEMENT: {
        "exact_phrases": [
            "independent auditor's report",
            "independent auditors report",
            "balance sheet as at",
            "statement of profit and loss",
            "profit & loss account",
            "profit and loss statement",
            "cash flow statement",
            "chartered accountants",
            "notes forming part of the financial statements",
            "to the members of",
        ],
        "strong_keywords": [
            "auditor's report",
            "balance sheet",
            "equity and liabilities",
            "current assets",
            "non-current assets",
            "revenue from operations",
            "net profit",
            "udin",
            "statutory audit",
        ],
        "supporting_keywords": [
            "depreciation",
            "contingent liabilities",
            "accounting policies",
            "financial year",
            "turnover",
            "share capital",
            "reserves and surplus",
            "tangible assets",
        ],
    },
    DocumentType.TECHNICAL_SPECIFICATION: {
        "exact_phrases": [
            "technical specification",
            "technical specifications",
            "technical compliance statement",
            "bill of quantities",
            "datasheet",
            "specification sheet",
            "scope of work and technical specifications",
            "technical compliance matrix",
            "compliance to technical specifications",
        ],
        "strong_keywords": [
            "compliance sheet",
            "model number",
            "operating temperature",
            "input voltage",
            "power consumption",
            "form factor",
            "datasheet",
            "technical parameters",
        ],
        "supporting_keywords": [
            "conformance",
            "test standards",
            "iso standard",
            "features",
            "specifications",
            "parameter",
            "offered specification",
            "compliance status",
        ],
    },
    DocumentType.MAKE_IN_INDIA_DECLARATION: {
        "exact_phrases": [
            "make in india",
            "local content declaration",
            "local content certificate",
            "class-i local supplier",
            "class-ii local supplier",
            "public procurement preference to make in india",
            "ppp-mii order",
            "declaration of local content",
        ],
        "strong_keywords": [
            "percentage of local content",
            "local value addition",
            "location of value addition",
            "local supplier",
            "self-certification under make in india",
            "minimum local content",
        ],
        "supporting_keywords": [
            "self-certification",
            "indigenous content",
            "order no. p-45021",
            "procurement policy division",
            "domestic content",
        ],
    },
    DocumentType.STARTUP_CERTIFICATE: {
        "exact_phrases": [
            "certificate of recognition",
            "startup india",
            "department for promotion of industry and internal trade",
            "dpiit",
            "department of industrial policy and promotion",
            "dipp",
            "startup recognition certificate",
        ],
        "strong_keywords": [
            "startup recognition",
            "dpiit recognition",
            "innovative product",
            "inter-ministerial board",
            "entity type",
            "startup entity",
        ],
        "supporting_keywords": [
            "incorporation date",
            "startup",
            "private limited",
            "scale of innovation",
            "ten years from date of incorporation",
        ],
    },
    DocumentType.NSIC_CERTIFICATE: {
        "exact_phrases": [
            "national small industries corporation",
            "government purchases enlisting scheme",
            "single point registration scheme",
            "nsic - crs",
            "nsic certificate",
            "sprs certificate",
        ],
        "strong_keywords": [
            "nsic",
            "monetary limit",
            "store details",
            "registration under sprs",
            "enterprise category",
            "store specification",
        ],
        "supporting_keywords": [
            "inspection report",
            "branch office",
            "valid up to",
            "commercial category",
            "qualitative capacity",
        ],
    },
}

# ---------------------------------------------------------------------------
# Disambiguation and Context Rules
# ---------------------------------------------------------------------------
def apply_context_disambiguation(
    scores: Dict[DocumentType, float],
    matched_signals_by_type: Dict[DocumentType, List[str]],
) -> Dict[DocumentType, float]:
    """
    Applies domain heuristics to disambiguate overlapping signal matches.

    Key Indian Public Procurement rules:
      1. A GST certificate mentions the proprietor's PAN. If strong GST signals exist,
         suppress incidental PAN signals.
      2. An OEM authorization mentions the tender number, bidder GSTIN/PAN. If OEM phrases
         are present, suppress incidental GST/PAN scores.
      3. A Financial Statement contains company registration details (CIN, GSTIN, PAN). If
         auditor's report / balance sheet phrases are present, suppress entity scores.
      4. An ITR-V verification form contains the assessee PAN. If ITR phrases are present,
         suppress PAN_DOCUMENT.
    """
    adjusted = dict(scores)

    gst_exact = any("gst" in s.lower() or "registration certificate" in s.lower() for s in matched_signals_by_type.get(DocumentType.GST_CERTIFICATE, []))
    oem_exact = any("manufacturer" in s.lower() or "authorize" in s.lower() for s in matched_signals_by_type.get(DocumentType.OEM_AUTHORIZATION, []))
    fin_exact = any("auditor" in s.lower() or "balance sheet" in s.lower() or "profit" in s.lower() for s in matched_signals_by_type.get(DocumentType.FINANCIAL_STATEMENT, []))
    itr_exact = any("income tax return" in s.lower() or "itr" in s.lower() for s in matched_signals_by_type.get(DocumentType.INCOME_TAX_DOCUMENT, []))

    # 1. GST dominant -> penalize incidental PAN only if GST score is higher
    if gst_exact and adjusted.get(DocumentType.GST_CERTIFICATE, 0) > adjusted.get(DocumentType.PAN_DOCUMENT, 0):
        adjusted[DocumentType.PAN_DOCUMENT] = max(0.0, adjusted[DocumentType.PAN_DOCUMENT] * 0.2)

    # 2. OEM dominant -> penalize incidental GST / PAN only if OEM score is higher
    if oem_exact:
        oem_score = adjusted.get(DocumentType.OEM_AUTHORIZATION, 0)
        for t in (DocumentType.GST_CERTIFICATE, DocumentType.PAN_DOCUMENT):
            if oem_score > adjusted.get(t, 0):
                adjusted[t] = max(0.0, adjusted[t] * 0.15)

    # 3. Financial statement dominant -> penalize incidental GST / PAN only if Fin score is higher
    if fin_exact:
        fin_score = adjusted.get(DocumentType.FINANCIAL_STATEMENT, 0)
        for t in (DocumentType.GST_CERTIFICATE, DocumentType.PAN_DOCUMENT):
            if fin_score > adjusted.get(t, 0):
                adjusted[t] = max(0.0, adjusted[t] * 0.15)

    # 4. ITR dominant -> penalize incidental PAN only if ITR score is higher
    if itr_exact and adjusted.get(DocumentType.INCOME_TAX_DOCUMENT, 0) > adjusted.get(DocumentType.PAN_DOCUMENT, 0):
        adjusted[DocumentType.PAN_DOCUMENT] = max(0.0, adjusted[DocumentType.PAN_DOCUMENT] * 0.2)

    return adjusted
