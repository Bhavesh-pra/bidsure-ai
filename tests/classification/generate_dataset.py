"""
Partial Developer 2 — Synthetic Classification Dataset Generator (Cycle 9).

Generates a realistic, demo-safe, and deterministic benchmark dataset for
document classification across all 10 canonical document types and edge-case
unknown categories, along with a machine-readable ground truth manifest.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List

# Try importing fitz for optional PDF generation
try:
    import fitz
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


DATASET_SAMPLES: List[Dict[str, Any]] = [
    # -----------------------------------------------------------------------
    # 1. GST Certificates
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-GST-01",
        "category": "gst",
        "filename": "gst_reg06_clean.txt",
        "pdf_filename": "gst_reg06_clean.pdf",
        "expected_type": "GST_CERTIFICATE",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Clean Form GST REG-06 Registration Certificate",
        "content": (
            "GOVERNMENT OF INDIA\n"
            "FORM GST REG-06\n"
            "Registration Certificate\n\n"
            "Registration Number (GSTIN): 27AABCA1234F1Z8\n"
            "Legal Name: Apex Infotech Systems Private Limited\n"
            "Trade Name: Apex Infotech\n"
            "Constitution of Business: Private Limited Company\n"
            "Address of Principal Place of Business: Plot 42, MIDC Andheri East, Mumbai, Maharashtra 400093\n"
            "Date of Liability: 01/07/2017\n"
            "Period of Validity: From 01/07/2017 to Continuing Regular\n"
            "Type of Registration: Regular Taxpayer\n"
            "State Jurisdiction: Maharashtra - Range IV, Division II, Commissionerate Mumbai East\n"
            "Centre Jurisdiction: Range 1, Division IV, Mumbai South\n\n"
            "This is a system generated certificate issued under the Central Goods and Services Tax Act, 2017."
        ),
    },
    {
        "id": "SAMPLE-GST-02",
        "category": "gst",
        "filename": "gst_multipage_annexure.txt",
        "pdf_filename": "gst_multipage_annexure.pdf",
        "expected_type": "GST_CERTIFICATE",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Multi-page GST Certificate with partner details",
        "content": (
            "GOVERNMENT OF INDIA\n"
            "CENTRAL GOODS AND SERVICES TAX ACT\n"
            "Registration Certificate\n"
            "GSTIN: 36AABCB5678G1Z2\n"
            "Legal Name: Bharat Telecom Infrastructure Limited\n"
            "Principal Place of Business: Madhapur, Hyderabad, Telangana 500081\n"
            "Date of Registration: 15/09/2018\n\n"
            "--- PAGE BREAK ---\n\n"
            "Details of Additional Places of Business\n"
            "Branch Office 1: Vijayawada, Andhra Pradesh\n"
            "Branch Office 2: Warangal, Telangana\n"
            "Taxpayer Type: Regular Taxable Person"
        ),
    },

    # -----------------------------------------------------------------------
    # 2. PAN Documents
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-PAN-01",
        "category": "pan",
        "filename": "pan_card_clean.txt",
        "pdf_filename": "pan_card_clean.pdf",
        "expected_type": "PAN_DOCUMENT",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Income Tax Department Permanent Account Number Card",
        "content": (
            "INCOME TAX DEPARTMENT\n"
            "GOVT. OF INDIA\n"
            "Permanent Account Number Card\n\n"
            "Permanent Account Number: AABCA1234F\n"
            "Name: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
            "Father's Name: SURESH CHANDRA SHARMA\n"
            "Date of Incorporation: 15/04/2015\n"
            "Taxpayer Identification Card issued by NSDL e-Governance"
        ),
    },
    {
        "id": "SAMPLE-PAN-02",
        "category": "pan",
        "filename": "pan_allotment_letter.txt",
        "pdf_filename": "pan_allotment_letter.pdf",
        "expected_type": "PAN_DOCUMENT",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.80,
        "description": "Income Tax PAN Allotment Letter under Form 49A",
        "content": (
            "GOVERNMENT OF INDIA INCOME TAX DEPARTMENT\n"
            "Office of the Deputy Commissioner of Income-Tax\n"
            "Form No. 49A - Intimation of Allotment of Permanent Account Number\n\n"
            "To: M/s Apex Infotech Systems Pvt Ltd\n"
            "Sir/Madam,\n"
            "We are pleased to inform that Permanent Account Number (PAN) AABCA1234F has been allotted to you.\n"
            "Please quote this Permanent Account Number in all your income tax returns and correspondence."
        ),
    },

    # -----------------------------------------------------------------------
    # 3. Udyam MSME Certificates
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-UDYAM-01",
        "category": "udyam",
        "filename": "udyam_registration_clean.txt",
        "pdf_filename": "udyam_registration_clean.pdf",
        "expected_type": "UDYAM_CERTIFICATE",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Official Udyam Registration Certificate",
        "content": (
            "UDYAM REGISTRATION CERTIFICATE\n"
            "MINISTRY OF MICRO, SMALL AND MEDIUM ENTERPRISES\n\n"
            "UDYAM REGISTRATION NUMBER: UDYAM-MH-01-0012345\n"
            "NAME OF ENTERPRISE: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
            "TYPE OF ENTERPRISE: MICRO ENTERPRISE\n"
            "MAJOR ACTIVITY: SERVICES\n"
            "SOCIAL CATEGORY: GENERAL\n"
            "DATE OF INCORPORATION: 15/04/2015\n"
            "NATIONAL INDUSTRY CLASSIFICATION (NIC 2 DIGIT): 62 - COMPUTER PROGRAMMING\n"
            "DISTRICT INDUSTRIES CENTRE: MUMBAI SUBURBAN\n"
            "MSME Development Act, 2006 compliance verified."
        ),
    },

    # -----------------------------------------------------------------------
    # 4. OEM Authorization Form
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-OEM-01",
        "category": "oem",
        "filename": "oem_maf_clean.txt",
        "pdf_filename": "oem_maf_clean.pdf",
        "expected_type": "OEM_AUTHORIZATION",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Manufacturer's Authorization Form (MAF)",
        "content": (
            "MANUFACTURERS AUTHORIZATION FORM (MAF)\n"
            "Date: 15th August 2026\n"
            "To: The Procurement Officer, National Informatics Centre\n"
            "Tender Reference No: GEM/2026/B/894512\n\n"
            "We, Cisco Systems India Private Limited, who are official manufacturers of Networking Equipment,\n"
            "having factories at Electronic City, Bangalore, do hereby authorize\n"
            "M/s Apex Infotech Systems Private Limited to submit bid, negotiate and conclude the contract\n"
            "with you against the above tender reference.\n"
            "We hereby extend our full comprehensive back to back warranty support as an original equipment manufacturer."
        ),
    },

    # -----------------------------------------------------------------------
    # 5. Income Tax Documents (ITR-V)
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-ITR-01",
        "category": "financial",
        "filename": "itr_v_acknowledgement.txt",
        "pdf_filename": "itr_v_acknowledgement.pdf",
        "expected_type": "INCOME_TAX_DOCUMENT",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Indian Income Tax Return Verification Form (ITR-V)",
        "content": (
            "INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT\n"
            "Income Tax Return Verification Form (ITR-V)\n"
            "Assessment Year: 2025-26\n"
            "Acknowledgement Number: 123456789012345\n"
            "PAN: AABCA1234F\n"
            "Name: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
            "Filing Section: 139(1)\n"
            "Gross Total Income: Rs. 5,20,00,000\n"
            "Total Tax Payable: Rs. 1,30,00,000\n"
            "Directorate of Income Tax (Systems), Centralized Processing Center, Bengaluru"
        ),
    },

    # -----------------------------------------------------------------------
    # 6. Financial Statements / Balance Sheet
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-FIN-01",
        "category": "financial",
        "filename": "balance_sheet_audited.txt",
        "pdf_filename": "balance_sheet_audited.pdf",
        "expected_type": "FINANCIAL_STATEMENT",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.85,
        "description": "Audited Balance Sheet and Auditor's Report with UDIN",
        "content": (
            "INDEPENDENT AUDITOR'S REPORT\n"
            "To the Members of Apex Infotech Systems Private Limited\n\n"
            "BALANCE SHEET AS AT 31ST MARCH 2026\n"
            "EQUITY AND LIABILITIES:\n"
            "Shareholder's Funds: Share Capital, Reserves and Surplus\n"
            "Current Liabilities: Trade Payables, Short-term Borrowings\n"
            "ASSETS:\n"
            "Non-current Assets: Tangible Fixed Assets, Depreciation\n"
            "Current Assets: Cash and Cash Equivalents, Trade Receivables\n"
            "STATEMENT OF PROFIT AND LOSS for the year ended 31st March 2026\n"
            "Revenue from Operations: Rs. 18,50,00,000\n"
            "Chartered Accountants\n"
            "UDIN: 26045678AAAAAA1234"
        ),
    },

    # -----------------------------------------------------------------------
    # 7. Technical Specifications
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-TECH-01",
        "category": "technical",
        "filename": "technical_compliance_sheet.txt",
        "pdf_filename": "technical_compliance_sheet.pdf",
        "expected_type": "TECHNICAL_SPECIFICATION",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.80,
        "description": "Technical Specification Compliance Sheet and Datasheet",
        "content": (
            "TECHNICAL SPECIFICATION AND COMPLIANCE STATEMENT\n"
            "Tender Reference: TND/2026/001 - Supply of Enterprise Core Switches\n"
            "Product Datasheet & Specification Sheet\n\n"
            "Item 1: Layer-3 Enterprise Switch\n"
            "Model Number: CS-9300-48P\n"
            "Operating Temperature: 0 to 45 deg C\n"
            "Input Voltage: 100-240 VAC, 50/60 Hz\n"
            "Power Consumption: 450W Maximum\n"
            "Form Factor: 1RU Rack Mountable\n"
            "Compliance Status: Compliant with IEEE 802.3 standards, ISO 9001 quality assurance"
        ),
    },

    # -----------------------------------------------------------------------
    # 8. Make in India Declaration
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-MII-01",
        "category": "make_in_india",
        "filename": "mii_local_content_cert.txt",
        "pdf_filename": "mii_local_content_cert.pdf",
        "expected_type": "MAKE_IN_INDIA_DECLARATION",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.80,
        "description": "Make in India Local Content Self-Declaration",
        "content": (
            "LOCAL CONTENT DECLARATION UNDER MAKE IN INDIA POLICY\n"
            "Public Procurement (Preference to Make in India) Order (PPP-MII)\n"
            "Self-Certification for Bidder: Apex Infotech Systems Pvt Ltd\n\n"
            "We hereby declare that our offered equipment contains 65.5% percentage of local content.\n"
            "We qualify as a Class-I Local Supplier as defined under the PPP-MII order.\n"
            "Location of Value Addition: MIDC Industrial Area, Pune, Maharashtra.\n"
            "Order No. P-45021 compliance certified."
        ),
    },

    # -----------------------------------------------------------------------
    # 9. Startup Certificate
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-STARTUP-01",
        "category": "startup",
        "filename": "dpiit_startup_recognition.txt",
        "pdf_filename": "dpiit_startup_recognition.pdf",
        "expected_type": "STARTUP_CERTIFICATE",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.80,
        "description": "DPIIT Startup India Recognition Certificate",
        "content": (
            "CERTIFICATE OF RECOGNITION\n"
            "STARTUP INDIA\n"
            "DEPARTMENT FOR PROMOTION OF INDUSTRY AND INTERNAL TRADE (DPIIT)\n\n"
            "This is to certify that Apex Cloud Labs Private Limited is recognized as a startup entity.\n"
            "DPIIT Recognition Number: DIPP89452\n"
            "Date of Incorporation: 12/01/2024\n"
            "Scale of Innovation: Cloud Infrastructure Security Automation"
        ),
    },

    # -----------------------------------------------------------------------
    # 10. NSIC Certificate
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-NSIC-01",
        "category": "nsic",
        "filename": "nsic_sprs_clean.txt",
        "pdf_filename": "nsic_sprs_clean.pdf",
        "expected_type": "NSIC_CERTIFICATE",
        "expected_status": "CLASSIFIED",
        "min_confidence": 0.80,
        "description": "NSIC Single Point Registration Scheme Certificate",
        "content": (
            "THE NATIONAL SMALL INDUSTRIES CORPORATION LIMITED (NSIC)\n"
            "GOVERNMENT PURCHASES ENLISTING SCHEME\n"
            "SINGLE POINT REGISTRATION SCHEME (SPRS CERTIFICATE)\n\n"
            "Enterprise Category: Micro Enterprise\n"
            "Monetary Limit: Rs. 50,00,000 (Fifty Lakhs Only)\n"
            "Store Details: Manufacturing of Electrical and Networking Equipment\n"
            "Branch Office: Andheri, Mumbai. Valid up to: 31/03/2028\n"
            "Inspection Report approved under NSIC - CRS rules."
        ),
    },

    # -----------------------------------------------------------------------
    # 11. Edge Cases (Unknown, Empty, Corrupted, Ambiguous)
    # -----------------------------------------------------------------------
    {
        "id": "SAMPLE-EDGE-EMPTY",
        "category": "unknown",
        "filename": "empty_document.txt",
        "pdf_filename": "empty_document.pdf",
        "expected_type": "UNKNOWN",
        "expected_status": "REVIEW_REQUIRED",
        "min_confidence": 0.0,
        "description": "Completely empty 0-word document",
        "content": "   \n\t  \n  ",
    },
    {
        "id": "SAMPLE-EDGE-RECIPE",
        "category": "unknown",
        "filename": "chocolate_cake_recipe.txt",
        "pdf_filename": "chocolate_cake_recipe.pdf",
        "expected_type": "UNKNOWN",
        "expected_status": "REVIEW_REQUIRED",
        "min_confidence": 0.0,
        "description": "Irrelevant random text (baking recipe)",
        "content": (
            "Preheat oven to 180 degrees Celsius. Grease and line two 8-inch round sandwich cake tins.\n"
            "Place sugar, butter, eggs, self-raising flour, cocoa powder, and baking powder in a large bowl.\n"
            "Mix until thoroughly combined and pour into tins. Bake for 25 minutes until well risen."
        ),
    },
    {
        "id": "SAMPLE-EDGE-NOISY",
        "category": "unknown",
        "filename": "corrupted_noisy_ocr.txt",
        "pdf_filename": "corrupted_noisy_ocr.pdf",
        "expected_type": "UNKNOWN",
        "expected_status": "REVIEW_REQUIRED",
        "min_confidence": 0.0,
        "description": "Heavily degraded OCR with dropped characters and noise",
        "content": (
            "G~T r*g!str@tion c&rtif!c@te ... 27AABCA... s0m3 n01sy text "
            "taxp@y3r det@ils ... unc1ear w0rds ... midc @ndh3ri #&% *!?"
        ),
    },
    {
        "id": "SAMPLE-EDGE-AMBIGUOUS",
        "category": "unknown",
        "filename": "ambiguous_oem_spec.txt",
        "pdf_filename": "ambiguous_oem_spec.pdf",
        "expected_type": "UNKNOWN",
        "expected_status": "REVIEW_REQUIRED",
        "min_confidence": 0.0,
        "description": "Mixed ambiguous document with equal OEM and Technical Spec signals",
        "content": (
            "MANUFACTURERS AUTHORIZATION FORM AND TECHNICAL COMPLIANCE\n"
            "We hereby authorize the bidder with our official OEM Authorization Letter\n"
            "Technical Specification Datasheet Compliance Statement\n"
            "Operating Temperature: 0 to 45 deg C, Model Number CS-9300\n"
            "Original Equipment Manufacturer authorized reseller agreement"
        ),
    },
]


def generate_dataset(base_dir: Path):
    """Generates the test files and writes the manifest."""
    docs_dir = ensure_dir(base_dir / "documents")
    manifest_path = base_dir / "dataset_manifest.json"

    manifest_entries = []

    print(f"Generating Classification Test Dataset in: {docs_dir.resolve()}")

    for item in DATASET_SAMPLES:
        cat_dir = ensure_dir(docs_dir / item["category"])
        txt_path = cat_dir / item["filename"]
        txt_path.write_text(item["content"], encoding="utf-8")

        # Optionally generate PDF
        pdf_rel_path = None
        if HAS_PYMUPDF and item.get("pdf_filename"):
            pdf_path = cat_dir / item["pdf_filename"]
            doc = fitz.open()
            page = doc.new_page(width=595, height=842)
            # Insert text lines
            lines = item["content"].split("\n")
            y = 50
            for line in lines:
                if line.strip() == "--- PAGE BREAK ---":
                    page = doc.new_page(width=595, height=842)
                    y = 50
                    continue
                page.insert_text((50, y), line, fontsize=10, fontname="helv")
                y += 18
                if y > 800:
                    page = doc.new_page(width=595, height=842)
                    y = 50
            doc.save(str(pdf_path))
            doc.close()
            pdf_rel_path = str(pdf_path.relative_to(base_dir)).replace("\\", "/")

        manifest_entries.append({
            "id": item["id"],
            "category": item["category"],
            "text_file": str(txt_path.relative_to(base_dir)).replace("\\", "/"),
            "pdf_file": pdf_rel_path,
            "expected_type": item["expected_type"],
            "expected_status": item["expected_status"],
            "min_confidence": item["min_confidence"],
            "description": item["description"],
        })

    # Write manifest
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_entries, f, indent=2)

    print(f"Dataset generated successfully. Manifest saved at: {manifest_path.resolve()}")


if __name__ == "__main__":
    current_dir = Path(__file__).parent.resolve()
    generate_dataset(current_dir)
