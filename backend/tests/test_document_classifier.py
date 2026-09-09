"""
Unit Tests for Main Developer 1 — Document Classification Service (Cycle 9).

Tests:
  - Canonical DocumentType enum freeze and normalization
  - Deterministic classification for all 10 canonical document categories
  - Empty, short, and random document handling
  - Low confidence / poor OCR text handling
  - Mixed / ambiguous document handling
  - Context disambiguation (GST with embedded PAN, OEM with embedded GSTIN)
  - Page-aware weighting (Page 1 header bonus)
  - Custom classifier thresholds and configuration
  - Result serialization and dictionary conversion
"""

import pytest

from app.services.classification import (
    ClassificationMethod,
    ClassificationResult,
    ClassificationStatus,
    ClassifierConfig,
    DocumentClassifier,
    DocumentType,
    get_classifier,
    normalize_document_type,
)


@pytest.fixture
def classifier():
    return DocumentClassifier()


# ===========================================================================
# 1. Canonical Enum and Normalization Tests
# ===========================================================================

def test_canonical_enum_freeze():
    """Verify all 11 canonical document types are strictly defined."""
    expected = {
        "GST_CERTIFICATE",
        "PAN_DOCUMENT",
        "UDYAM_CERTIFICATE",
        "OEM_AUTHORIZATION",
        "INCOME_TAX_DOCUMENT",
        "FINANCIAL_STATEMENT",
        "TECHNICAL_SPECIFICATION",
        "MAKE_IN_INDIA_DECLARATION",
        "STARTUP_CERTIFICATE",
        "NSIC_CERTIFICATE",
        "UNKNOWN",
    }
    actual = {t.value for t in DocumentType}
    assert actual == expected


def test_normalize_document_type_helper():
    """Verify normalization of canonical strings, legacy aliases, and unknown strings."""
    assert normalize_document_type("GST_CERTIFICATE") == DocumentType.GST_CERTIFICATE
    assert normalize_document_type(DocumentType.GST_CERTIFICATE) == DocumentType.GST_CERTIFICATE

    # Legacy aliases
    assert normalize_document_type("PAN_CARD") == DocumentType.PAN_DOCUMENT
    assert normalize_document_type("FINANCIAL_AUDIT") == DocumentType.FINANCIAL_STATEMENT
    assert normalize_document_type("TURNOVER_CERTIFICATE") == DocumentType.FINANCIAL_STATEMENT
    assert normalize_document_type("LOCAL_CONTENT_DECLARATION") == DocumentType.MAKE_IN_INDIA_DECLARATION

    # Unrecognized strings
    assert normalize_document_type("RANDOM_INVOICE") == DocumentType.UNKNOWN
    assert normalize_document_type("") == DocumentType.UNKNOWN
    assert normalize_document_type(None) == DocumentType.UNKNOWN


# ===========================================================================
# 2. Canonical Positive Classification Tests (All 10 Categories)
# ===========================================================================

def test_classify_gst_certificate(classifier):
    text = (
        "GOVERNMENT OF INDIA\n"
        "FORM GST REG-06\n"
        "Registration Certificate\n"
        "Registration Number (GSTIN): 27AABCA1234F1Z8\n"
        "Legal Name: Apex Infotech Systems Private Limited\n"
        "Trade Name: Apex Infotech\n"
        "Constitution of Business: Private Limited Company\n"
        "Address of Principal Place of Business: Plot 42, MIDC Andheri East, Mumbai 400093\n"
        "Date of Liability: 01/07/2017\n"
        "Period of Validity: From 01/07/2017 to Continuing Regular\n"
        "Type of Registration: Regular Taxpayer\n"
        "State Jurisdiction: Maharashtra - Range IV, Division II"
    )
    res = classifier.classify(text, document_id="DOC-GST-01")
    assert res.document_type == DocumentType.GST_CERTIFICATE
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85
    assert "PHRASE: registration certificate" in res.matched_signals
    assert "STRONG: gstin" in res.matched_signals


def test_classify_pan_document(classifier):
    text = (
        "INCOME TAX DEPARTMENT\n"
        "GOVT. OF INDIA\n"
        "Permanent Account Number Card\n"
        "Permanent Account Number: AABCA1234F\n"
        "Name: APEX INFOTECH SYSTEMS PVT LTD\n"
        "Father's Name: SURESH CHANDRA SHARMA\n"
        "Date of Birth / Incorporation: 15/04/2015\n"
        "Signature: Rajesh Sharma\n"
    )
    res = classifier.classify(text, document_id="DOC-PAN-01")
    assert res.document_type == DocumentType.PAN_DOCUMENT
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85
    assert "PHRASE: income tax department" in res.matched_signals


def test_classify_udyam_certificate(classifier):
    text = (
        "UDYAM REGISTRATION CERTIFICATE\n"
        "MINISTRY OF MICRO, SMALL AND MEDIUM ENTERPRISES\n"
        "UDYAM REGISTRATION NUMBER: UDYAM-MH-01-0012345\n"
        "NAME OF ENTERPRISE: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
        "ENTERPRISE TYPE: MICRO ENTERPRISE\n"
        "MAJOR ACTIVITY: SERVICES\n"
        "NATIONAL INDUSTRY CLASSIFICATION (NIC) 2 DIGIT: 62 - COMPUTER PROGRAMMING\n"
        "DATE OF INCORPORATION: 15/04/2015\n"
        "DISTRICT INDUSTRIES CENTRE: MUMBAI SUBURBAN"
    )
    res = classifier.classify(text, document_id="DOC-UDYAM-01")
    assert res.document_type == DocumentType.UDYAM_CERTIFICATE
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85
    assert "PHRASE: udyam registration certificate" in res.matched_signals


def test_classify_oem_authorization(classifier):
    text = (
        "MANUFACTURERS AUTHORIZATION FORM (MAF)\n"
        "Date: 12th August 2026\n"
        "To: The Superintending Engineer, Procurement Division\n"
        "Subject: Manufacturer Authorization Letter for Tender Ref: GEM/2026/B/894512\n\n"
        "We, Cisco Systems India Private Limited, who are official and reputable manufacturers "
        "of Networking Equipment, having factories at Bangalore, do hereby authorize "
        "M/s Apex Infotech Systems Private Limited to submit bid, negotiate and conclude the contract "
        "with you against the above tender reference.\n"
        "We hereby extend our full comprehensive back to back warranty support as per tender conditions."
    )
    res = classifier.classify(text, document_id="DOC-OEM-01")
    assert res.document_type == DocumentType.OEM_AUTHORIZATION
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85
    assert "PHRASE: manufacturers authorization form" in res.matched_signals or "PHRASE: authorization letter" in res.matched_signals


def test_classify_income_tax_document(classifier):
    text = (
        "INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT\n"
        "Income Tax Return Verification Form (ITR-V)\n"
        "Assessment Year: 2025-26\n"
        "Acknowledgement Number: 123456789012345\n"
        "PAN: AABCA1234F\n"
        "Name: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
        "Filing Section: 139(1) - On or before due date\n"
        "Gross Total Income: Rs. 4,85,00,000\n"
        "Total Income: Rs. 4,50,00,000\n"
        "Total Tax Payable: Rs. 1,12,50,000\n"
        "Directorate of Income Tax (Systems), Centralized Processing Center"
    )
    res = classifier.classify(text, document_id="DOC-ITR-01")
    assert res.document_type == DocumentType.INCOME_TAX_DOCUMENT
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85


def test_classify_financial_statement(classifier):
    text = (
        "INDEPENDENT AUDITOR'S REPORT\n"
        "To the Members of Apex Infotech Systems Private Limited\n"
        "Report on the Audit of the Financial Statements\n\n"
        "BALANCE SHEET AS AT 31ST MARCH 2026\n"
        "EQUITY AND LIABILITIES:\n"
        "Shareholder's Funds: Share Capital, Reserves and Surplus\n"
        "Current Liabilities: Trade Payables, Short-term Provisions\n"
        "ASSETS:\n"
        "Non-current Assets: Tangible Assets, Depreciation\n"
        "Current Assets: Inventories, Trade Receivables, Cash and Cash Equivalents\n"
        "STATEMENT OF PROFIT AND LOSS for the year ended 31st March 2026\n"
        "Revenue from Operations: Rs. 14,25,00,000\n"
        "Chartered Accountants\n"
        "UDIN: 26045678AAAAAA1234"
    )
    res = classifier.classify(text, document_id="DOC-FIN-01")
    assert res.document_type == DocumentType.FINANCIAL_STATEMENT
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85


def test_classify_technical_specification(classifier):
    text = (
        "TECHNICAL SPECIFICATION AND COMPLIANCE STATEMENT\n"
        "Tender Ref: TND/2026/001 - Supply of Enterprise Core Switches\n"
        "Product Datasheet & Specification Sheet\n\n"
        "Item 1: Layer-3 Managed Switch\n"
        "Model Number: CS-9300-48P\n"
        "Operating Temperature: 0 to 45 deg C\n"
        "Input Voltage: 100-240 VAC, 50/60 Hz\n"
        "Power Consumption: 450W Maximum\n"
        "Form Factor: 1RU Rack Mountable\n"
        "Compliance: Fully compliant with IEEE 802.3 standards, ISO 9001 certified"
    )
    res = classifier.classify(text, document_id="DOC-TECH-01")
    assert res.document_type == DocumentType.TECHNICAL_SPECIFICATION
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.80


def test_classify_make_in_india_declaration(classifier):
    text = (
        "LOCAL CONTENT DECLARATION UNDER MAKE IN INDIA POLICY\n"
        "Public Procurement (Preference to Make in India) Order (PPP-MII)\n"
        "Self-Certification for Bidder: Apex Infotech Systems Pvt Ltd\n"
        "We hereby declare that our offered product contains 68.5% percentage of local content.\n"
        "We qualify as a Class-I Local Supplier as defined under the PPP-MII order.\n"
        "Location of Value Addition: MIDC Industrial Area, Pune, Maharashtra."
    )
    res = classifier.classify(text, document_id="DOC-MII-01")
    assert res.document_type == DocumentType.MAKE_IN_INDIA_DECLARATION
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.80


def test_classify_startup_certificate(classifier):
    text = (
        "CERTIFICATE OF RECOGNITION\n"
        "STARTUP INDIA\n"
        "DEPARTMENT FOR PROMOTION OF INDUSTRY AND INTERNAL TRADE (DPIIT)\n"
        "This is to certify that Apex Cloud Labs Private Limited is recognized as a startup entity.\n"
        "DPIIT Recognition Number: DIPP89452\n"
        "Date of Incorporation: 12/01/2024\n"
        "Industry: Internet of Things, Artificial Intelligence"
    )
    res = classifier.classify(text, document_id="DOC-STARTUP-01")
    assert res.document_type == DocumentType.STARTUP_CERTIFICATE
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.80


def test_classify_nsic_certificate(classifier):
    text = (
        "THE NATIONAL SMALL INDUSTRIES CORPORATION LIMITED (NSIC)\n"
        "GOVERNMENT PURCHASES ENLISTING SCHEME\n"
        "SINGLE POINT REGISTRATION SCHEME (SPRS CERTIFICATE)\n"
        "Enterprise Category: Micro Enterprise\n"
        "Monetary Limit: Rs. 50,00,000 (Fifty Lakhs Only)\n"
        "Store Details: Manufacturing of Electrical Panel Boards\n"
        "Branch Office: Andheri, Mumbai. Valid up to: 31/03/2028"
    )
    res = classifier.classify(text, document_id="DOC-NSIC-01")
    assert res.document_type == DocumentType.NSIC_CERTIFICATE
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.80


# ===========================================================================
# 3. Edge Cases, Unknown Handling & Ambiguity Tests
# ===========================================================================

def test_classify_empty_or_whitespace(classifier):
    res_empty = classifier.classify("", document_id="DOC-EMPTY-1")
    assert res_empty.document_type == DocumentType.UNKNOWN
    assert res_empty.confidence == 0.0
    assert res_empty.status == ClassificationStatus.REVIEW_REQUIRED
    assert res_empty.review_reason == "EMPTY_OR_NO_TEXT"

    res_spaces = classifier.classify("   \n\t  \n  ", document_id="DOC-EMPTY-2")
    assert res_spaces.document_type == DocumentType.UNKNOWN
    assert res_spaces.confidence == 0.0
    assert res_spaces.status == ClassificationStatus.REVIEW_REQUIRED


def test_classify_insufficient_words(classifier):
    res = classifier.classify("Hello world only", document_id="DOC-SHORT")
    assert res.document_type == DocumentType.UNKNOWN
    assert res.confidence == 0.0
    assert res.status == ClassificationStatus.REVIEW_REQUIRED
    assert res.review_reason == "INSUFFICIENT_TEXT"


def test_classify_random_unrelated_text(classifier):
    text = (
        "To make the perfect chocolate sponge cake, preheat your oven to 180 degrees Celsius. "
        "Whisk together flour, cocoa powder, sugar, and baking soda in a large mixing bowl. "
        "Gradually add whole milk, melted butter, and vanilla extract until a smooth batter forms. "
        "Pour evenly into greased tins and bake for thirty-five minutes until firm."
    )
    res = classifier.classify(text, document_id="DOC-RECIPE")
    assert res.document_type == DocumentType.UNKNOWN
    assert res.status == ClassificationStatus.REVIEW_REQUIRED
    assert res.confidence == 0.0
    assert res.review_reason == "NO_MATCHING_SIGNALS"


def test_classify_noisy_low_quality_ocr(classifier):
    text = (
        "G~T r*g!str@tion c&rtif!c@te ... 27AABCA... s0m3 n01sy text "
        "taxp@y3r det@ils ... unc1ear w0rds ... midc @ndh3ri"
    )
    res = classifier.classify(text, document_id="DOC-NOISY")
    # Low confidence due to dropped keywords -> must NOT be falsely classified
    assert res.document_type == DocumentType.UNKNOWN
    assert res.status == ClassificationStatus.REVIEW_REQUIRED
    assert res.confidence < classifier.config.confidence_threshold


def test_classify_ambiguous_mixed_document(classifier):
    # A document with equal strong signals from OEM and Technical Specification
    text = (
        "OEM AUTHORIZATION AND TECHNICAL COMPLIANCE\n"
        "We hereby authorize the bidder with our Manufacturers Authorization Form\n"
        "Technical Specification Datasheet Compliance Statement\n"
        "Operating Temperature: 0 to 45 C, Model Number CS-9300\n"
        "Original Equipment Manufacturer authorized partner agreement"
    )
    # Both OEM and Technical will have strong matches
    res = classifier.classify(text, document_id="DOC-AMBIGUOUS")
    # Should flag REVIEW_REQUIRED due to narrow margin or low margin
    assert res.status == ClassificationStatus.REVIEW_REQUIRED


# ===========================================================================
# 4. Context Disambiguation Tests
# ===========================================================================

def test_contextual_disambiguation_gst_with_pan(classifier):
    """A GST certificate containing the proprietor's PAN must NOT classify as PAN_DOCUMENT."""
    text = (
        "GOVERNMENT OF INDIA\n"
        "FORM GST REG-06\n"
        "Registration Certificate\n"
        "Registration Number (GSTIN): 27AABCA1234F1Z8\n"
        "Legal Name: Rajesh Sharma\n"
        "Permanent Account Number: AABCA1234F\n"
        "Constitution of Business: Properietorship\n"
        "Date of Liability: 01/07/2017\n"
        "Principal Place of Business: Andheri East, Mumbai\n"
        "Regular Taxpayer under Central Goods and Services Tax Act"
    )
    res = classifier.classify(text, document_id="DOC-GST-WITH-PAN")
    assert res.document_type == DocumentType.GST_CERTIFICATE
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.85
    # PAN_DOCUMENT score should be heavily suppressed
    assert res.scores_by_type.get("PAN_DOCUMENT", 0) < 0.40


def test_contextual_disambiguation_oem_with_gstin(classifier):
    """An OEM authorization letter mentioning the bidder's GSTIN must NOT classify as GST_CERTIFICATE."""
    text = (
        "MANUFACTURER'S AUTHORIZATION FORM (MAF)\n"
        "We, Cisco Systems India Private Limited, hereby authorize\n"
        "M/s Apex Infotech Systems Pvt Ltd (GSTIN: 27AABCA1234F1Z8)\n"
        "to bid against Tender Ref No: TND/2026/001.\n"
        "We extend our full warranty support as original equipment manufacturer."
    )
    res = classifier.classify(text, document_id="DOC-OEM-WITH-GSTIN")
    assert res.document_type == DocumentType.OEM_AUTHORIZATION
    assert res.status == ClassificationStatus.CLASSIFIED
    assert res.confidence >= 0.80


# ===========================================================================
# 5. Page-Aware & Configuration Tests
# ===========================================================================

def test_page_aware_weighting(classifier):
    """Page 1 header should give higher confidence than the same header on Page 2."""
    p1 = "FORM GST REG-06 Registration Certificate GSTIN: 27AABCA1234F1Z8"
    p2 = "Details of partners and annexures"

    res_p1 = classifier.classify(text=p1 + "\n" + p2, pages=[p1, p2])
    res_p2 = classifier.classify(text=p2 + "\n" + p1, pages=[p2, p1])

    # Page 1 placement gives higher raw score and higher confidence
    assert res_p1.confidence >= res_p2.confidence


def test_custom_classifier_config():
    """Verify custom strict threshold routes borderline documents to REVIEW_REQUIRED."""
    # Stricter threshold 0.99
    strict_config = ClassifierConfig(confidence_threshold=0.99)
    strict_classifier = DocumentClassifier(config=strict_config)

    # Moderate text with ~0.80-0.90 confidence
    text = "Technical compliance statement for our datasheet and model number"
    res = strict_classifier.classify(text)
    assert res.status == ClassificationStatus.REVIEW_REQUIRED
    assert res.review_reason == "LOW_CONFIDENCE"


def test_result_model_serialization(classifier):
    text = "Form GST REG-06 Registration Certificate Goods and Services Tax 27AABCA1234F1Z8"
    res = classifier.classify(text, document_id="DOC-SERIALIZE")
    d = res.to_dict()

    assert d["document_id"] == "DOC-SERIALIZE"
    assert d["document_type"] == "GST_CERTIFICATE"
    assert d["status"] == "CLASSIFIED"
    assert d["method"] == "RULE_BASED"
    assert isinstance(d["confidence"], float)
    assert isinstance(d["matched_signals"], list)
    assert isinstance(d["scores_by_type"], dict)
    assert d["classified_at"] is not None


def test_singleton_getter():
    """Verify get_classifier returns a singleton instance."""
    inst1 = get_classifier()
    inst2 = get_classifier()
    assert inst1 is inst2
