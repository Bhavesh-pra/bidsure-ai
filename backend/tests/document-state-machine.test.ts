import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DocumentStatus } from "@prisma/client";
import {
  isValidDocumentTransition,
  assertValidDocumentTransition,
} from "../src/modules/documents/document.state-machine.js";
import { DocumentInvalidTransitionError } from "../src/modules/documents/document.errors.js";

describe("Phase 08 — Document State Machine Unit Tests", () => {
  it("allows legal progression: UPLOADING -> SCANNING -> PROCESSING -> READY", () => {
    assert.ok(isValidDocumentTransition(DocumentStatus.UPLOADING, DocumentStatus.SCANNING));
    assert.ok(isValidDocumentTransition(DocumentStatus.SCANNING, DocumentStatus.PROCESSING));
    assert.ok(isValidDocumentTransition(DocumentStatus.PROCESSING, DocumentStatus.READY));
    assert.doesNotThrow(() => {
      assertValidDocumentTransition(DocumentStatus.UPLOADING, DocumentStatus.SCANNING);
      assertValidDocumentTransition(DocumentStatus.SCANNING, DocumentStatus.PROCESSING);
      assertValidDocumentTransition(DocumentStatus.PROCESSING, DocumentStatus.READY);
    });
  });

  it("allows quarantine branch from SCANNING", () => {
    assert.ok(isValidDocumentTransition(DocumentStatus.SCANNING, DocumentStatus.QUARANTINED));
    assert.doesNotThrow(() => {
      assertValidDocumentTransition(DocumentStatus.SCANNING, DocumentStatus.QUARANTINED);
    });
  });

  it("allows failure branch from SCANNING or PROCESSING", () => {
    assert.ok(isValidDocumentTransition(DocumentStatus.SCANNING, DocumentStatus.FAILED));
    assert.ok(isValidDocumentTransition(DocumentStatus.PROCESSING, DocumentStatus.FAILED));
  });

  it("allows retry branch: FAILED -> PROCESSING", () => {
    assert.ok(isValidDocumentTransition(DocumentStatus.FAILED, DocumentStatus.PROCESSING));
    assert.doesNotThrow(() => {
      assertValidDocumentTransition(DocumentStatus.FAILED, DocumentStatus.PROCESSING);
    });
  });

  it("allows replacement branch: FAILED -> REPLACEMENT_REQUIRED and QUARANTINED -> REPLACEMENT_REQUIRED", () => {
    assert.ok(isValidDocumentTransition(DocumentStatus.FAILED, DocumentStatus.REPLACEMENT_REQUIRED));
    assert.ok(isValidDocumentTransition(DocumentStatus.QUARANTINED, DocumentStatus.REPLACEMENT_REQUIRED));
  });

  it("rejects illegal transitions with DocumentInvalidTransitionError (409)", () => {
    const illegalTransitions: Array<[DocumentStatus, DocumentStatus]> = [
      [DocumentStatus.UPLOADING, DocumentStatus.READY], // Direct jump to READY
      [DocumentStatus.SCANNING, DocumentStatus.READY], // Skipping processing
      [DocumentStatus.READY, DocumentStatus.PROCESSING], // Reprocessing ready doc
      [DocumentStatus.QUARANTINED, DocumentStatus.READY], // Quarantined to ready
      [DocumentStatus.QUARANTINED, DocumentStatus.PROCESSING], // Quarantined to processing
      [DocumentStatus.REPLACEMENT_REQUIRED, DocumentStatus.READY], // Superseded to ready
    ];

    for (const [from, to] of illegalTransitions) {
      assert.equal(isValidDocumentTransition(from, to), false, `Transition ${from} -> ${to} must be illegal`);
      assert.throws(
        () => assertValidDocumentTransition(from, to),
        (err: any) => {
          assert.ok(err instanceof DocumentInvalidTransitionError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, "DOCUMENT_INVALID_STATE_TRANSITION");
          return true;
        }
      );
    }
  });

  it("allows self-transitions as idempotent no-op", () => {
    for (const status of Object.values(DocumentStatus)) {
      assert.ok(isValidDocumentTransition(status, status));
    }
  });
});
