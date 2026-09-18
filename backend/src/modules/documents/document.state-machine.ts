import { DocumentStatus } from "@prisma/client";
import { DocumentInvalidTransitionError } from "./document.errors.js";

/**
 * Authoritative Document State Machine Transition Table.
 *
 * Enforces strictly permitted lifecycle transitions:
 *   UPLOADING -> SCANNING
 *   SCANNING -> PROCESSING | QUARANTINED | FAILED
 *   PROCESSING -> READY | FAILED
 *   FAILED -> PROCESSING (retry) | REPLACEMENT_REQUIRED
 *   QUARANTINED -> REPLACEMENT_REQUIRED
 */
export const ALLOWED_DOCUMENT_TRANSITIONS: Record<DocumentStatus, ReadonlySet<DocumentStatus>> = {
  [DocumentStatus.UPLOADING]: new Set([DocumentStatus.SCANNING, DocumentStatus.FAILED]),
  [DocumentStatus.SCANNING]: new Set([
    DocumentStatus.PROCESSING,
    DocumentStatus.QUARANTINED,
    DocumentStatus.FAILED,
  ]),
  [DocumentStatus.PROCESSING]: new Set([DocumentStatus.READY, DocumentStatus.FAILED]),
  [DocumentStatus.READY]: new Set([DocumentStatus.REPLACEMENT_REQUIRED]),
  [DocumentStatus.FAILED]: new Set([DocumentStatus.PROCESSING, DocumentStatus.REPLACEMENT_REQUIRED]),
  [DocumentStatus.QUARANTINED]: new Set([DocumentStatus.REPLACEMENT_REQUIRED]),
  [DocumentStatus.REPLACEMENT_REQUIRED]: new Set([]), // Terminal state for superseded record
};

/**
 * Validates whether a state transition from `currentStatus` to `targetStatus` is permitted.
 */
export function isValidDocumentTransition(
  currentStatus: DocumentStatus,
  targetStatus: DocumentStatus
): boolean {
  if (currentStatus === targetStatus) return true; // Idempotent no-op
  const allowed = ALLOWED_DOCUMENT_TRANSITIONS[currentStatus];
  return allowed ? allowed.has(targetStatus) : false;
}

/**
 * Asserts that a transition is legal. Throws DocumentInvalidTransitionError (409 Conflict) if illegal.
 */
export function assertValidDocumentTransition(
  currentStatus: DocumentStatus,
  targetStatus: DocumentStatus
): void {
  if (!isValidDocumentTransition(currentStatus, targetStatus)) {
    throw new DocumentInvalidTransitionError(currentStatus, targetStatus);
  }
}
