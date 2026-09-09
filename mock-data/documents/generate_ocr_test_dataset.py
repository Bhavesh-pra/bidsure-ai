"""
Partial Developer 2 — OCR Test Dataset Generator for Cycle 8.

Generates:
1. tests/ocr/documents/
   - 01_gst_clear_text.pdf (2 pages, high-quality digital text)
   - 02_pan_scanned_image.pdf (1 page, rasterized scan image inside PDF, no text stream)
   - 03_oem_multipage.pdf (3 pages, multi-page clear document)
   - 04_udyam_low_quality.pdf (1 page, low-res raster scan inside PDF)
   - 05_rotated_page.pdf (1 page, rotated content)
   - 06_empty.pdf (1 page, completely blank)
   - 07_scanned_pan.png (standalone image)
   - 08_scanned_pan.jpg (standalone image)
2. tests/ocr/expected/
   - Ground truth text files for verification and benchmark comparison.
3. tests/ocr/README.md
"""

import io
import os
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def create_clear_text_page(
    doc: fitz.Document,
    title: str,
    subtitle: str,
    fields: list[tuple[str, str]],
    footer: str,
    page_num: int = 1,
    total_pages: int = 1,
) -> fitz.Page:
    """Creates a page with vector text and structured layout."""
    page = doc.new_page(width=595, height=842)  # A4

    # Header banner
    rect = fitz.Rect(35, 35, 560, 95)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), fill=(0.94, 0.96, 0.99), width=1)
    page.insert_text((50, 62), title, fontsize=14, fontname="helv", color=(0.1, 0.2, 0.5))
    page.insert_text((50, 82), subtitle, fontsize=9, fontname="helv", color=(0.35, 0.35, 0.35))

    # Field table
    y = 135
    for label, val in fields:
        page.insert_text((50, y), label, fontsize=10, fontname="helv", color=(0.3, 0.3, 0.3))
        page.insert_text((230, y), val, fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))
        page.draw_line(fitz.Point(45, y + 6), fitz.Point(550, y + 6), color=(0.88, 0.88, 0.88), width=0.5)
        y += 28

    # Footer
    page.draw_line(fitz.Point(35, 785), fitz.Point(560, 785), color=(0.7, 0.7, 0.7), width=0.8)
    page.insert_text((50, 802), footer, fontsize=8, fontname="helv", color=(0.45, 0.45, 0.45))
    page.insert_text(
        (460, 802),
        f"Page {page_num} of {total_pages}",
        fontsize=8,
        fontname="helv",
        color=(0.45, 0.45, 0.45),
    )
    return page


def rasterize_page_to_scanned_pdf(source_page: fitz.Page, target_path: Path, dpi: int = 150):
    """Converts a vector PDF page into a pure rasterized image PDF with no text stream."""
    pix = source_page.get_pixmap(dpi=dpi)
    img_data = pix.tobytes("png")

    scanned_doc = fitz.open()
    new_page = scanned_doc.new_page(width=595, height=842)
    new_page.insert_image(new_page.rect, stream=img_data)
    scanned_doc.save(str(target_path))
    scanned_doc.close()


def generate_ocr_dataset(root_dir: Path):
    docs_dir = ensure_dir(root_dir / "tests" / "ocr" / "documents")
    expected_dir = ensure_dir(root_dir / "tests" / "ocr" / "expected")

    print(f"Generating OCR Test Dataset at: {docs_dir.resolve()}")

    # -------------------------------------------------------------------------
    # 1. Clear Digital Text PDF (GST.pdf - 2 Pages)
    # -------------------------------------------------------------------------
    gst_doc = fitz.open()
    gst_p1_fields = [
        ("Registration Number (GSTIN):", "27AABCA1234F1Z8"),
        ("Legal Name:", "Apex Infotech Systems Private Limited"),
        ("Trade Name:", "Apex Infotech"),
        ("Constitution of Business:", "Private Limited Company"),
        ("Address of Principal Place:", "Plot 42, Tech Park, MIDC Andheri East, Mumbai 400093"),
        ("State Jurisdiction:", "Maharashtra - Range IV, Division II"),
        ("Date of Liability:", "01/07/2017"),
        ("Period of Validity:", "From 01/07/2017 to Continuing Regular"),
        ("Type of Registration:", "Standard Regular Taxpayer"),
    ]
    create_clear_text_page(
        gst_doc,
        title="GOVERNMENT OF INDIA - GOODS AND SERVICES TAX",
        subtitle="Form GST REG-06 | Registration Certificate",
        fields=gst_p1_fields,
        footer="Issuing Authority: Assistant Commissioner of Commercial Taxes, Maharashtra",
        page_num=1,
        total_pages=2,
    )

    gst_p2_fields = [
        ("Annexure A - Details of Additional Places:", "None Declared"),
        ("Managing Director:", "Rajesh Sharma (DIN: 01234567)"),
        ("Authorized Signatory:", "Priya Verma (PAN: ABCPV1234F)"),
        ("Permanent Account Number:", "AABCA1234F"),
        ("Date of Issuance:", "15/07/2017"),
        ("Verification Status:", "Digital Signature Verified - Valid Certificate"),
    ]
    create_clear_text_page(
        gst_doc,
        title="GOVERNMENT OF INDIA - GOODS AND SERVICES TAX",
        subtitle="Form GST REG-06 | Annexure - Management Details",
        fields=gst_p2_fields,
        footer="Certified Official System Generated Copy - BidSure AI Test Suite",
        page_num=2,
        total_pages=2,
    )
    gst_path = docs_dir / "01_gst_clear_text.pdf"
    gst_doc.save(str(gst_path))
    gst_doc.close()

    # Ground truth for GST
    (expected_dir / "gst_page_1.txt").write_text(
        "GOVERNMENT OF INDIA - GOODS AND SERVICES TAX\n"
        "Form GST REG-06 | Registration Certificate\n"
        "Registration Number (GSTIN): 27AABCA1234F1Z8\n"
        "Legal Name: Apex Infotech Systems Private Limited\n"
        "Trade Name: Apex Infotech\n"
        "Constitution of Business: Private Limited Company\n"
        "Address of Principal Place: Plot 42, Tech Park, MIDC Andheri East, Mumbai 400093\n"
        "State Jurisdiction: Maharashtra - Range IV, Division II\n"
        "Date of Liability: 01/07/2017\n"
        "Period of Validity: From 01/07/2017 to Continuing Regular\n"
        "Type of Registration: Standard Regular Taxpayer\n"
        "Issuing Authority: Assistant Commissioner of Commercial Taxes, Maharashtra\n"
        "Page 1 of 2",
        encoding="utf-8",
    )
    (expected_dir / "gst_page_2.txt").write_text(
        "GOVERNMENT OF INDIA - GOODS AND SERVICES TAX\n"
        "Form GST REG-06 | Annexure - Management Details\n"
        "Annexure A - Details of Additional Places: None Declared\n"
        "Managing Director: Rajesh Sharma (DIN: 01234567)\n"
        "Authorized Signatory: Priya Verma (PAN: ABCPV1234F)\n"
        "Permanent Account Number: AABCA1234F\n"
        "Date of Issuance: 15/07/2017\n"
        "Verification Status: Digital Signature Verified - Valid Certificate\n"
        "Certified Official System Generated Copy - BidSure AI Test Suite\n"
        "Page 2 of 2",
        encoding="utf-8",
    )

    # -------------------------------------------------------------------------
    # 2. Scanned PDF (PAN.pdf - Rasterized image, No embedded text stream)
    # -------------------------------------------------------------------------
    pan_temp_doc = fitz.open()
    pan_fields = [
        ("Permanent Account Number (PAN):", "AABCA1234F"),
        ("Name of Assessee:", "APEX INFOTECH SYSTEMS PRIVATE LIMITED"),
        ("Date of Incorporation:", "15/03/2015"),
        ("Entity Classification:", "Company (Domestic)"),
        ("Father / Authorized Officer:", "RAJESH SHARMA"),
        ("Assessing Officer Ward:", "Ward 12(3), Mumbai"),
    ]
    p = create_clear_text_page(
        pan_temp_doc,
        title="INCOME TAX DEPARTMENT - GOVERNMENT OF INDIA",
        subtitle="Permanent Account Number Card Verification Copy",
        fields=pan_fields,
        footer="Computer Generated Taxpayer Identification Document - Scanned Reproduction",
        page_num=1,
        total_pages=1,
    )
    pan_path = docs_dir / "02_pan_scanned_image.pdf"
    rasterize_page_to_scanned_pdf(p, pan_path, dpi=200)
    pan_temp_doc.close()

    # Ground truth for PAN
    (expected_dir / "pan_page_1.txt").write_text(
        "INCOME TAX DEPARTMENT - GOVERNMENT OF INDIA\n"
        "Permanent Account Number Card Verification Copy\n"
        "Permanent Account Number (PAN): AABCA1234F\n"
        "Name of Assessee: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
        "Date of Incorporation: 15/03/2015\n"
        "Entity Classification: Company (Domestic)\n"
        "Father / Authorized Officer: RAJESH SHARMA\n"
        "Assessing Officer Ward: Ward 12(3), Mumbai\n"
        "Computer Generated Taxpayer Identification Document - Scanned Reproduction\n"
        "Page 1 of 1",
        encoding="utf-8",
    )

    # -------------------------------------------------------------------------
    # 3. Multi-page PDF (OEM Authorization - 3 Pages)
    # -------------------------------------------------------------------------
    oem_doc = fitz.open()
    oem_p1 = [
        ("Authorization Reference:", "OEM-AUTH-2026-089"),
        ("Manufacturer / OEM:", "Cisco Systems India Pvt Ltd"),
        ("Authorized Partner:", "Apex Infotech Systems Private Limited"),
        ("Tender Reference:", "TND-2026-99 / Network Infrastructure"),
        ("Territory of Authorization:", "Republic of India"),
        ("Validity Period:", "Valid until 31/12/2026"),
    ]
    create_clear_text_page(
        oem_doc,
        title="MANUFACTURER AUTHORIZATION FORM (MAF)",
        subtitle="Official OEM Guarantee & Back-to-Back Support Commitment",
        fields=oem_p1,
        footer="Signed: Director of Global Partner Alliances, Cisco Systems",
        page_num=1,
        total_pages=3,
    )

    oem_p2 = [
        ("Authorized Product Line:", "Catalyst 9300 Switches, ISR 4000 Routers"),
        ("Warranty Commitment:", "5 Years Comprehensive OEM Onsite Replacement"),
        ("Service Level Agreement:", "24x7 TAC Support with 4-Hour Response"),
        ("Escalation Manager:", "Suresh Nair (Head of Enterprise Support)"),
        ("Spare Parts Depot:", "Mumbai & Bangalore Central Depots"),
    ]
    create_clear_text_page(
        oem_doc,
        title="MANUFACTURER AUTHORIZATION FORM (MAF)",
        subtitle="Schedule of Covered Equipment & Service Commitments",
        fields=oem_p2,
        footer="Schedule A - Service Level Agreement and Technical Warranty",
        page_num=2,
        total_pages=3,
    )

    oem_p3 = [
        ("Declaration of Non-Blacklisting:", "OEM confirms partner is in good standing"),
        ("Genuine Spares Certificate:", "All equipment supplied is factory new and genuine"),
        ("End of Sale / Life Assurance:", "Product supported for minimum 7 years from supply"),
        ("Notarization Date:", "20/01/2026"),
    ]
    create_clear_text_page(
        oem_doc,
        title="MANUFACTURER AUTHORIZATION FORM (MAF)",
        subtitle="Regulatory Compliance & Partner Warranty Declarations",
        fields=oem_p3,
        footer="Schedule B - Statutory Undertakings and Signatures",
        page_num=3,
        total_pages=3,
    )
    oem_path = docs_dir / "03_oem_multipage.pdf"
    oem_doc.save(str(oem_path))
    oem_doc.close()

    (expected_dir / "oem_page_1.txt").write_text(
        "MANUFACTURER AUTHORIZATION FORM (MAF)\n"
        "Authorization Reference: OEM-AUTH-2026-089\n"
        "Manufacturer / OEM: Cisco Systems India Pvt Ltd\n"
        "Authorized Partner: Apex Infotech Systems Private Limited\n"
        "Page 1 of 3",
        encoding="utf-8",
    )
    (expected_dir / "oem_page_2.txt").write_text(
        "MANUFACTURER AUTHORIZATION FORM (MAF)\n"
        "Authorized Product Line: Catalyst 9300 Switches, ISR 4000 Routers\n"
        "Warranty Commitment: 5 Years Comprehensive OEM Onsite Replacement\n"
        "Page 2 of 3",
        encoding="utf-8",
    )
    (expected_dir / "oem_page_3.txt").write_text(
        "MANUFACTURER AUTHORIZATION FORM (MAF)\n"
        "Declaration of Non-Blacklisting: OEM confirms partner is in good standing\n"
        "Genuine Spares Certificate: All equipment supplied is factory new and genuine\n"
        "Page 3 of 3",
        encoding="utf-8",
    )

    # -------------------------------------------------------------------------
    # 4. Low-Quality Scan (Udyam.pdf - Rasterized at lower 90 DPI)
    # -------------------------------------------------------------------------
    udyam_temp_doc = fitz.open()
    udyam_fields = [
        ("Udyam Registration Number:", "UDYAM-MH-01-0012345"),
        ("Name of Enterprise:", "APEX INFOTECH SYSTEMS PRIVATE LIMITED"),
        ("Enterprise Classification:", "Small Enterprise"),
        ("Major Activity:", "Services - Information Technology & Cloud Solutions"),
        ("National Industry Code (NIC):", "6201 - Computer Programming and Consultancy"),
        ("Date of Udyam Registration:", "10/08/2020"),
    ]
    p_udyam = create_clear_text_page(
        udyam_temp_doc,
        title="UDYAM REGISTRATION CERTIFICATE",
        subtitle="Ministry of Micro, Small and Medium Enterprises - Govt of India",
        fields=udyam_fields,
        footer="Official MSME Certificate of Enterprise Registration",
        page_num=1,
        total_pages=1,
    )
    udyam_path = docs_dir / "04_udyam_low_quality.pdf"
    rasterize_page_to_scanned_pdf(p_udyam, udyam_path, dpi=90)
    udyam_temp_doc.close()

    (expected_dir / "udyam_page_1.txt").write_text(
        "UDYAM REGISTRATION CERTIFICATE\n"
        "Ministry of Micro, Small and Medium Enterprises - Govt of India\n"
        "Udyam Registration Number: UDYAM-MH-01-0012345\n"
        "Name of Enterprise: APEX INFOTECH SYSTEMS PRIVATE LIMITED\n"
        "Enterprise Classification: Small Enterprise\n"
        "Date of Udyam Registration: 10/08/2020",
        encoding="utf-8",
    )

    # -------------------------------------------------------------------------
    # 5. Rotated / Irregular Page PDF
    # -------------------------------------------------------------------------
    rot_doc = fitz.open()
    p_rot = create_clear_text_page(
        rot_doc,
        title="SUPPLEMENTARY LOCAL CONTENT DECLARATION",
        subtitle="Make In India Class-I Local Supplier Undertaking",
        fields=[
            ("Local Content Percentage:", "68.5%"),
            ("Manufacturing Location:", "MIDC Pune Industrial Area, Maharashtra"),
            ("Statutory Auditor:", "K. S. Sharma & Co., Chartered Accountants"),
        ],
        footer="Public Procurement (Preference to Make in India) Order 2017",
        page_num=1,
        total_pages=1,
    )
    p_rot.set_rotation(90)  # Rotated 90 degrees clockwise
    rot_path = docs_dir / "05_rotated_page.pdf"
    rot_doc.save(str(rot_path))
    rot_doc.close()

    # -------------------------------------------------------------------------
    # 6. Completely Blank / Empty PDF
    # -------------------------------------------------------------------------
    empty_doc = fitz.open()
    empty_doc.new_page(width=595, height=842)
    empty_path = docs_dir / "06_empty.pdf"
    empty_doc.save(str(empty_path))
    empty_doc.close()

    # -------------------------------------------------------------------------
    # 7. Standalone Image Files (PNG & JPG Scans)
    # -------------------------------------------------------------------------
    img = Image.new("RGB", (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.rectangle([(20, 20), (780, 80)], fill=(240, 245, 255), outline=(30, 60, 120), width=2)
    draw.text((40, 35), "INCOME TAX DEPARTMENT - GOVERNMENT OF INDIA", fill=(20, 40, 100))
    draw.text((40, 55), "Permanent Account Number Card", fill=(80, 80, 80))

    draw.text((40, 120), "PAN: AABCA1234F", fill=(0, 0, 0))
    draw.text((40, 160), "Name: APEX INFOTECH SYSTEMS PVT LTD", fill=(0, 0, 0))
    draw.text((40, 200), "Date of Incorporation: 15/03/2015", fill=(0, 0, 0))
    draw.text((40, 240), "Father's / Representative's Name: RAJESH SHARMA", fill=(0, 0, 0))
    draw.text((40, 420), "Official Scanned Digital Image Copy", fill=(120, 120, 120))

    img_png_path = docs_dir / "07_scanned_pan.png"
    img.save(str(img_png_path), format="PNG")

    img_jpg_path = docs_dir / "08_scanned_pan.jpg"
    img.save(str(img_jpg_path), format="JPEG", quality=85)

    (expected_dir / "scanned_pan.txt").write_text(
        "INCOME TAX DEPARTMENT - GOVERNMENT OF INDIA\n"
        "Permanent Account Number Card\n"
        "PAN: AABCA1234F\n"
        "Name: APEX INFOTECH SYSTEMS PVT LTD\n"
        "Date of Incorporation: 15/03/2015",
        encoding="utf-8",
    )

    # -------------------------------------------------------------------------
    # 8. README.md Documentation
    # -------------------------------------------------------------------------
    readme_content = """# BidSure AI — Cycle 8 OCR Test Dataset

Prepared by **Partial Developer 2 (Data / AI Support)**.

This dataset provides deterministic, reproducible test documents to validate the **Cycle 8 OCR Pipeline** across all real-world bidder document variants.

## Directory Structure
```
tests/ocr/
├── documents/
│   ├── 01_gst_clear_text.pdf     # 2 Pages - Clean digital vector PDF (uses direct text extraction)
│   ├── 02_pan_scanned_image.pdf   # 1 Page - Pure raster scan inside PDF (forces OCR)
│   ├── 03_oem_multipage.pdf       # 3 Pages - Multi-page clear document (tests page separation)
│   ├── 04_udyam_low_quality.pdf   # 1 Page - Low-resolution scan (tests confidence calculation)
│   ├── 05_rotated_page.pdf        # 1 Page - 90-degree rotated document
│   ├── 06_empty.pdf               # 1 Page - Completely blank page (tests UNREADABLE handling)
│   ├── 07_scanned_pan.png         # Standalone PNG image upload
│   └── 08_scanned_pan.jpg         # Standalone JPG image upload
├── expected/
│   ├── gst_page_1.txt             # Ground truth text for GST Page 1
│   ├── gst_page_2.txt             # Ground truth text for GST Page 2
│   ├── pan_page_1.txt             # Ground truth text for PAN Card
│   ├── oem_page_1.txt             # Ground truth text for OEM Page 1
│   ├── oem_page_2.txt             # Ground truth text for OEM Page 2
│   ├── oem_page_3.txt             # Ground truth text for OEM Page 3
│   ├── udyam_page_1.txt           # Ground truth text for Udyam
│   └── scanned_pan.txt            # Ground truth text for Image scan
└── README.md
```

## Test Objectives & Expected Behavior

| Document | Target Pipeline Behavior | Expected OCR Output |
| :--- | :--- | :--- |
| `01_gst_clear_text.pdf` | Direct extraction via PyMuPDF. | `confidence = 1.0`, 2 separate pages, exact GSTIN. |
| `02_pan_scanned_image.pdf` | Image detection -> Raster OCR. | OCR executed, PAN token `AABCA1234F` extracted. |
| `03_oem_multipage.pdf` | Page-aware multi-page separation. | 3 pages in order, distinct text per page. |
| `04_udyam_low_quality.pdf` | Low-resolution OCR. | Extracted text with lower confidence (< 0.85). |
| `05_rotated_page.pdf` | Orientation handling. | OCR attempts extraction without crash. |
| `06_empty.pdf` | No extractable text. | Controlled status `UNREADABLE` (no server 500). |
| `07_scanned_pan.png` | Direct image OCR. | Treated as Page 1, confidence recorded. |
| `08_scanned_pan.jpg` | Direct image OCR. | Treated as Page 1, confidence recorded. |

## Regenerating the Dataset
Run the generator script at any time:
```bash
python mock-data/documents/generate_ocr_test_dataset.py
```
"""
    (root_dir / "tests" / "ocr" / "README.md").write_text(readme_content, encoding="utf-8")
    print("OCR Test Dataset successfully generated!")


if __name__ == "__main__":
    project_root = Path(__file__).parent.parent.parent
    generate_ocr_dataset(project_root)
