"""
Partial Developer 2 — Synthetic Bidder Documents & Test Matrix Generator.

Generates safe, authentic demo documents and test matrix files using PyMuPDF (fitz)
and computes a structured metadata dataset (JSON) for Cycle 7 testing and future
Cycle 8–10 (OCR, classification, entity extraction) benchmarks.
"""

import hashlib
import json
import os
from pathlib import Path
import fitz  # PyMuPDF


def compute_sha256(file_path: Path) -> str:
    """Compute SHA-256 hex digest of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def create_pdf_page(title: str, subtitle: str, fields: list[tuple[str, str]], footer: str) -> fitz.Document:
    """Helper to build a cleanly styled single-page synthetic document."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4 size

    # Decorative header banner
    rect = fitz.Rect(30, 30, 565, 85)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), fill=(0.95, 0.96, 0.98), width=1)

    page.insert_text((45, 55), title, fontsize=15, fontname="helv", color=(0.1, 0.2, 0.5))
    page.insert_text((45, 75), subtitle, fontsize=9, fontname="helv", color=(0.4, 0.4, 0.4))

    # Watermark / Notice
    page.insert_text((180, 110), "--- SYNTHETIC DEMO DOCUMENT - FOR TESTING ONLY ---", fontsize=8, fontname="helv", color=(0.8, 0.2, 0.2))

    # Content table
    y = 140
    for label, val in fields:
        # Label
        page.insert_text((45, y), label, fontsize=10, fontname="helv", color=(0.3, 0.3, 0.3))
        # Value
        page.insert_text((220, y), val, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
        # Light line
        page.draw_line(fitz.Point(40, y + 6), fitz.Point(555, y + 6), color=(0.88, 0.88, 0.88), width=0.5)
        y += 28

    # Footer
    page.draw_line(fitz.Point(30, 780), fitz.Point(565, 780), color=(0.7, 0.7, 0.7), width=0.8)
    page.insert_text((45, 795), footer, fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))
    page.insert_text((45, 810), "Certified Synthetic Benchmark Document - BidSure AI Test Suite", fontsize=7, fontname="helv", color=(0.6, 0.6, 0.6))

    return doc


def generate_synthetic_documents(output_dir: Path) -> dict[str, dict]:
    """Generate 6 realistic synthetic bidder documents."""
    output_dir.mkdir(parents=True, exist_ok=True)
    meta = {}

    # 1. GST.pdf
    doc = create_pdf_page(
        title="GOVERNMENT OF INDIA - GOODS AND SERVICES TAX",
        subtitle="Form GST REG-06 | Registration Certificate",
        fields=[
            ("Registration Number (GSTIN):", "27AABCA1234F1Z8"),
            ("Legal Name:", "Apex Infotech Systems Private Limited"),
            ("Trade Name:", "Apex Infotech"),
            ("Constitution of Business:", "Private Limited Company"),
            ("Address of Principal Place:", "Plot 42, Tech Park, MIDC Andheri East, Mumbai 400093"),
            ("State Jurisdiction:", "Maharashtra - Range IV, Division II"),
            ("Date of Liability:", "01/07/2017"),
            ("Period of Validity:", "Regular / Active"),
            ("Type of Registration:", "Standard Regular Taxpayer"),
        ],
        footer="Issuing Authority: Assistant Commissioner of Commercial Taxes, Maharashtra",
    )
    gst_path = output_dir / "GST.pdf"
    doc.save(str(gst_path))
    doc.close()
    meta["GST.pdf"] = {
        "document_type": "GST_CERTIFICATE",
        "entity_legal_name": "Apex Infotech Systems Private Limited",
        "gstin": "27AABCA1234F1Z8",
        "state": "Maharashtra",
    }

    # 2. PAN.pdf
    doc = create_pdf_page(
        title="INCOME TAX DEPARTMENT - GOVERNMENT OF INDIA",
        subtitle="Permanent Account Number Card Verification Copy",
        fields=[
            ("Permanent Account Number (PAN):", "AABCA1234F"),
            ("Name of Assessee:", "APEX INFOTECH SYSTEMS PRIVATE LIMITED"),
            ("Date of Incorporation:", "15/03/2015"),
            ("Entity Classification:", "Company (Domestic)"),
            ("Assessing Officer Ward:", "Ward 12(3), Mumbai"),
            ("PAN Status:", "Active and Operative"),
        ],
        footer="National Securities Depository Limited (NSDL) / UTIITSL Verification",
    )
    pan_path = output_dir / "PAN.pdf"
    doc.save(str(pan_path))
    doc.close()
    meta["PAN.pdf"] = {
        "document_type": "PAN_CARD",
        "entity_legal_name": "APEX INFOTECH SYSTEMS PRIVATE LIMITED",
        "pan": "AABCA1234F",
        "incorporation_date": "15/03/2015",
    }

    # 3. Udyam.pdf
    doc = create_pdf_page(
        title="MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES",
        subtitle="UDYAM REGISTRATION CERTIFICATE",
        fields=[
            ("Udyam Registration Number:", "UDYAM-MH-01-0098765"),
            ("Name of Enterprise:", "M/S APEX INFOTECH SYSTEMS PRIVATE LIMITED"),
            ("Enterprise Classification:", "MEDIUM ENTERPRISE"),
            ("Major Activity:", "SERVICES & MANUFACTURING"),
            ("Social Category of Entrepreneur:", "General"),
            ("Date of Incorporation:", "15/03/2015"),
            ("National Industry Code (NIC):", "62011 - Writing, modifying, testing of computer software"),
            ("Date of Udyam Registration:", "12/08/2020"),
        ],
        footer="Ministry of MSME, Government of India - UDYAM Portal Official Record",
    )
    udyam_path = output_dir / "Udyam.pdf"
    doc.save(str(udyam_path))
    doc.close()
    meta["Udyam.pdf"] = {
        "document_type": "UDYAM_CERTIFICATE",
        "entity_legal_name": "M/S APEX INFOTECH SYSTEMS PRIVATE LIMITED",
        "udyam_number": "UDYAM-MH-01-0098765",
        "enterprise_type": "MEDIUM",
    }

    # 4. OEM.pdf
    doc = create_pdf_page(
        title="MANUFACTURER'S AUTHORIZATION FORM (MAF)",
        subtitle="Global Silicon & Network Technologies Inc. Partner Authorization",
        fields=[
            ("Issuing Manufacturer (OEM):", "Global Silicon & Network Technologies Inc."),
            ("OEM Headquarters:", "Silicon Valley, CA, USA & Bangalore Technology Center"),
            ("Authorized Partner:", "Apex Infotech Systems Private Limited"),
            ("Authorization Reference:", "OEM-AUTH-2026-IND-8821"),
            ("Authorized Scope:", "Quoting, Supply, Installation & 3-Year 24x7 Enterprise Warranty"),
            ("Target Territory:", "Republic of India - Public Procurement & Government Tenders"),
            ("Validity Period:", "Valid until 31st December 2027"),
            ("Authorized Signatory:", "VP of Enterprise Channels & Strategic Alliances"),
        ],
        footer="Global Silicon & Network Technologies Partner Alliance Directorate",
    )
    oem_path = output_dir / "OEM.pdf"
    doc.save(str(oem_path))
    doc.close()
    meta["OEM.pdf"] = {
        "document_type": "OEM_AUTHORIZATION",
        "oem_name": "Global Silicon & Network Technologies Inc.",
        "authorized_partner": "Apex Infotech Systems Private Limited",
        "valid_until": "2027-12-31",
    }

    # 5. Financial.pdf
    doc = create_pdf_page(
        title="CHARTERED ACCOUNTANTS TURNOVER & NET WORTH CERTIFICATE",
        subtitle="Statutory Auditor Certificate for Tender Qualification",
        fields=[
            ("Audited Entity:", "Apex Infotech Systems Private Limited"),
            ("Auditing Firm:", "M/s R. K. Sharma & Associates, Chartered Accountants"),
            ("Firm Registration No (FRN):", "104523W"),
            ("Turnover FY 2022-2023:", "INR 10,50,00,000 (Rupees Ten Crore Fifty Lakhs)"),
            ("Turnover FY 2023-2024:", "INR 12,80,00,000 (Rupees Twelve Crore Eighty Lakhs)"),
            ("Turnover FY 2024-2025:", "INR 14,00,00,000 (Rupees Fourteen Crore)"),
            ("Average Annual Turnover (3 Yrs):", "INR 12,43,33,333 (Rupees Twelve Crore Forty-Three Lakhs)"),
            ("Audited Net Worth (as on 31 Mar 2025):", "INR 8,20,00,000 (Positive Net Worth)"),
            ("UDIN Reference:", "25104523BGHTY8821"),
        ],
        footer="Certified by Partner, FCA Membership No. 048291, UDIN Verified",
    )
    fin_path = output_dir / "Financial.pdf"
    doc.save(str(fin_path))
    doc.close()
    meta["Financial.pdf"] = {
        "document_type": "FINANCIAL_STATEMENT",
        "entity_legal_name": "Apex Infotech Systems Private Limited",
        "avg_annual_turnover_inr": 124333333,
        "net_worth_inr": 82000000,
        "udin": "25104523BGHTY8821",
    }

    # 6. Technical.pdf
    doc = create_pdf_page(
        title="TECHNICAL SPECIFICATION & PAST EXPERIENCE CERTIFICATE",
        subtitle="Enterprise Cloud & Network Infrastructure Delivery",
        fields=[
            ("Bidder Legal Name:", "Apex Infotech Systems Private Limited"),
            ("Project / Scope Name:", "National Digital Infrastructure Network Deployment"),
            ("Client Department:", "State Directorate of Information Technology"),
            ("Contract Value:", "INR 9,50,00,000 (Nine Crore Fifty Lakhs)"),
            ("Deployment Status:", "100% Successfully Completed & Commissioned"),
            ("Completion Date:", "31/01/2025"),
            ("Technical Specifications:", "Tier-3 Datacenter, 10Gbps Core Switching, ISO 27001"),
            ("Performance Feedback:", "Satisfactory - Zero downtime reported over SLA period"),
        ],
        footer="Client Certification: Director of IT Infrastructure & Procurement",
    )
    tech_path = output_dir / "Technical.pdf"
    doc.save(str(tech_path))
    doc.close()
    meta["Technical.pdf"] = {
        "document_type": "TECHNICAL_SPECIFICATION",
        "entity_legal_name": "Apex Infotech Systems Private Limited",
        "contract_value_inr": 95000000,
        "completion_date": "2025-01-31",
    }

    return meta


def generate_test_matrix(output_dir: Path) -> dict[str, dict]:
    """Generate 8 test matrix files covering all edge cases."""
    output_dir.mkdir(parents=True, exist_ok=True)
    matrix_meta = {}

    # 1. valid_pdf.pdf
    doc = fitz.open()
    page = doc.new_page(width=400, height=400)
    page.insert_text((50, 200), "Valid Test Matrix PDF Document", fontsize=14)
    vpdf_path = output_dir / "valid_pdf.pdf"
    doc.save(str(vpdf_path))
    doc.close()
    matrix_meta["valid_pdf.pdf"] = {
        "expected_result": "PASS",
        "mime_type": "application/pdf",
        "note": "Standard valid PDF document",
    }

    # 2. valid_jpg.jpg
    vjpg_path = output_dir / "valid_jpg.jpg"
    # JPEG header: \xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00 + payload + EOI \xff\xd9
    jpeg_bytes = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        + b"\x00" * 300
        + b"\xff\xd9"
    )
    vjpg_path.write_bytes(jpeg_bytes)
    matrix_meta["valid_jpg.jpg"] = {
        "expected_result": "PASS",
        "mime_type": "image/jpeg",
        "note": "Standard valid JPEG image with valid SOI and EOI markers",
    }

    # 3. valid_png.png
    vpng_path = output_dir / "valid_png.png"
    # Minimal 1x1 PNG binary
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    vpng_path.write_bytes(png_bytes)
    matrix_meta["valid_png.png"] = {
        "expected_result": "PASS",
        "mime_type": "image/png",
        "note": "Standard valid PNG image with standard PNG signature and IEND",
    }

    # 4. empty_pdf.pdf
    epdf_path = output_dir / "empty_pdf.pdf"
    epdf_path.write_bytes(b"")
    matrix_meta["empty_pdf.pdf"] = {
        "expected_result": "FAIL",
        "expected_error_code": "EMPTY_FILE",
        "note": "Zero-byte file rejected on ingestion",
    }

    # 5. large_pdf.pdf (> 10 MB limit)
    lpdf_path = output_dir / "large_pdf.pdf"
    # 10.5 MB = 11,010,048 bytes
    target_size = 11 * 1024 * 1024
    with open(lpdf_path, "wb") as f:
        f.write(b"%PDF-1.4\n")
        remaining = target_size - len(b"%PDF-1.4\n")
        f.write(b"0" * remaining)
    matrix_meta["large_pdf.pdf"] = {
        "expected_result": "FAIL",
        "expected_error_code": "FILE_TOO_LARGE",
        "note": "11 MB file exceeds 10 MB limit",
    }

    # 6. duplicate_pdf.pdf (byte clone of valid_pdf.pdf)
    dpdf_path = output_dir / "duplicate_pdf.pdf"
    dpdf_path.write_bytes(vpdf_path.read_bytes())
    matrix_meta["duplicate_pdf.pdf"] = {
        "expected_result": "FAIL_ON_SECOND_UPLOAD",
        "expected_error_code": "DOCUMENT_DUPLICATE",
        "note": "Exact byte clone of valid_pdf.pdf, produces matching SHA-256 hash",
    }

    # 7. wrong_extension.pdf (plain text masquerading as PDF)
    wext_path = output_dir / "wrong_extension.pdf"
    wext_path.write_text("MZ This is executable or plain text content, not a PDF.", encoding="utf-8")
    matrix_meta["wrong_extension.pdf"] = {
        "expected_result": "FAIL",
        "expected_error_code": "INVALID_FILE_SIGNATURE",
        "note": "Extension .pdf with non-PDF content rejected via magic byte check",
    }

    # 8. corrupted_file.pdf
    corrupt_path = output_dir / "corrupted_file.pdf"
    corrupt_path.write_bytes(b"%PDF-\x00\x00\xffGarbageCorruptedBinaryWithoutValidTrailer\x00")
    matrix_meta["corrupted_file.pdf"] = {
        "expected_result": "FAIL",
        "expected_error_code": "INVALID_FILE_SIGNATURE",
        "note": "Corrupted header rejected via file signature check",
    }

    return matrix_meta


def build_metadata_dataset(base_dir: Path, syn_meta: dict, matrix_meta: dict) -> dict:
    """Combine file stats, computed SHA-256, and expectations into one JSON dataset."""
    dataset = {
        "version": "1.0.0",
        "cycle": 7,
        "description": "BidSure AI Cycle 7 Synthetic Bidder Documents and Test Matrix Dataset",
        "synthetic_documents": {},
        "test_matrix": {},
    }

    syn_dir = base_dir / "synthetic"
    for filename, extra in syn_meta.items():
        fp = syn_dir / filename
        dataset["synthetic_documents"][filename] = {
            "filename": filename,
            "path": f"mock-data/documents/synthetic/{filename}",
            "size_bytes": fp.stat().st_size,
            "sha256": compute_sha256(fp),
            "document_type": extra["document_type"],
            "expected_status": "UPLOADED",
            "metadata": extra,
        }

    mat_dir = base_dir / "test-matrix"
    for filename, extra in matrix_meta.items():
        fp = mat_dir / filename
        dataset["test_matrix"][filename] = {
            "filename": filename,
            "path": f"mock-data/documents/test-matrix/{filename}",
            "size_bytes": fp.stat().st_size,
            "sha256": compute_sha256(fp) if fp.stat().st_size > 0 else "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "expected_result": extra["expected_result"],
            "expected_error_code": extra.get("expected_error_code"),
            "note": extra["note"],
        }

    out_json = base_dir / "metadata_dataset.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    return dataset


def main():
    base_dir = Path(__file__).resolve().parent
    print(f"[Partial Dev 2] Generating synthetic documents and test matrix in {base_dir}...")

    syn_meta = generate_synthetic_documents(base_dir / "synthetic")
    print(f"  [OK] Generated {len(syn_meta)} synthetic documents in synthetic/")

    matrix_meta = generate_test_matrix(base_dir / "test-matrix")
    print(f"  [OK] Generated {len(matrix_meta)} test matrix files in test-matrix/")

    dataset = build_metadata_dataset(base_dir, syn_meta, matrix_meta)
    print(f"  [OK] Saved metadata dataset to {base_dir / 'metadata_dataset.json'}")
    print("[Partial Dev 2] Generation completed successfully!")


if __name__ == "__main__":
    main()
