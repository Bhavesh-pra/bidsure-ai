import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { validateUploadedFile } from "../src/modules/documents/document.validator.js";
import { FileValidationError } from "../src/modules/documents/document.errors.js";

describe("Phase 08 — Authoritative File Validator Unit Tests", () => {
  // 1. Valid PDF
  it("validates authentic PDF buffer and generates correct SHA-256", () => {
    const pdfContent = Buffer.concat([
      Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
      Buffer.from("extra content for test"),
    ]);
    const expectedHash = crypto.createHash("sha256").update(pdfContent).digest("hex");

    const result = validateUploadedFile({
      buffer: pdfContent,
      originalname: "Technical_Proposal.pdf",
      mimetype: "application/pdf",
      size: pdfContent.length,
    });

    assert.equal(result.extension, "pdf");
    assert.equal(result.canonicalMimeType, "application/pdf");
    assert.equal(result.sanitizedFilename, "Technical_Proposal.pdf");
    assert.equal(result.sha256, expectedHash);
    assert.equal(result.sizeBytes, pdfContent.length);
  });

  // 2. Valid PNG
  it("validates authentic PNG buffer and canonical MIME", () => {
    const pngContent = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from("IHDR chunk sample data"),
    ]);

    const result = validateUploadedFile({
      buffer: pngContent,
      originalname: "company_stamp.png",
      mimetype: "image/png",
      size: pngContent.length,
    });

    assert.equal(result.extension, "png");
    assert.equal(result.canonicalMimeType, "image/png");
    assert.equal(result.sanitizedFilename, "company_stamp.png");
  });

  // 3. Valid JPG
  it("validates authentic JPG buffer and canonical MIME", () => {
    const jpgContent = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
      Buffer.from("sample jpeg image data"),
    ]);

    const result = validateUploadedFile({
      buffer: jpgContent,
      originalname: "signature.jpg",
      mimetype: "image/jpeg",
      size: jpgContent.length,
    });

    assert.equal(result.extension, "jpg");
    assert.equal(result.canonicalMimeType, "image/jpeg");
  });

  // 4. Empty File Rejected
  it("rejects empty file buffer with EMPTY_FILE", () => {
    assert.throws(
      () => {
        validateUploadedFile({
          buffer: Buffer.alloc(0),
          originalname: "empty.pdf",
          mimetype: "application/pdf",
          size: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof FileValidationError);
        assert.equal(err.code, "EMPTY_FILE");
        return true;
      }
    );
  });

  // 5. Oversized File (>10MB) Rejected
  it("rejects oversized file buffer (>10MB) with FILE_TOO_LARGE (413)", () => {
    const elevenMb = 11 * 1024 * 1024;
    // Create a sparse buffer or header buffer of size > 10MB
    const oversizedBuffer = Buffer.alloc(elevenMb);
    oversizedBuffer.write("%PDF-", 0);

    assert.throws(
      () => {
        validateUploadedFile({
          buffer: oversizedBuffer,
          originalname: "huge.pdf",
          mimetype: "application/pdf",
          size: elevenMb,
        });
      },
      (err: any) => {
        assert.ok(err instanceof FileValidationError);
        assert.equal(err.code, "FILE_TOO_LARGE");
        assert.equal(err.statusCode, 413);
        return true;
      }
    );
  });

  // 6. Unsupported Extension Rejected
  it("rejects unsupported extensions (.exe, .sh, .docx, .zip)", () => {
    const forbidden = ["evil.exe", "script.sh", "notes.docx", "archive.zip"];
    for (const name of forbidden) {
      assert.throws(
        () => {
          validateUploadedFile({
            buffer: Buffer.from("dummy data"),
            originalname: name,
            mimetype: "application/octet-stream",
            size: 10,
          });
        },
        (err: any) => {
          assert.ok(err instanceof FileValidationError);
          assert.equal(err.code, "UNSUPPORTED_FILE_TYPE");
          return true;
        }
      );
    }
  });

  // 7. MIME Spoofing Rejected (extension mismatch)
  it("rejects declared MIME that contradicts extension", () => {
    const pdfContent = Buffer.from("%PDF-1.7\nfake content");
    assert.throws(
      () => {
        validateUploadedFile({
          buffer: pdfContent,
          originalname: "document.pdf",
          mimetype: "image/png", // Spoofed / mismatched MIME
          size: pdfContent.length,
        });
      },
      (err: any) => {
        assert.ok(err instanceof FileValidationError);
        assert.equal(err.code, "UNSUPPORTED_FILE_TYPE");
        return true;
      }
    );
  });

  // 8. Magic-Byte Mismatch Rejected (MIME and extension spoofed)
  it("rejects file named .pdf with application/pdf MIME but plain-text content", () => {
    const fakePdf = Buffer.from("Hello world, this is a plain text file pretending to be PDF.");
    assert.throws(
      () => {
        validateUploadedFile({
          buffer: fakePdf,
          originalname: "financial_audit.pdf",
          mimetype: "application/pdf",
          size: fakePdf.length,
        });
      },
      (err: any) => {
        assert.ok(err instanceof FileValidationError);
        assert.equal(err.code, "INVALID_FILE_SIGNATURE");
        return true;
      }
    );
  });

  // 9. Path Traversal Neutralization in Filename
  it("sanitizes path traversal sequences in original filename safely", () => {
    const pdfContent = Buffer.from("%PDF-1.7\nsafe content");
    const result = validateUploadedFile({
      buffer: pdfContent,
      originalname: "../../etc/shadow.pdf",
      mimetype: "application/pdf",
      size: pdfContent.length,
    });

    assert.equal(result.sanitizedFilename, "shadow.pdf");
    assert.ok(!result.sanitizedFilename.includes(".."));
    assert.ok(!result.sanitizedFilename.includes("/"));
  });
});
