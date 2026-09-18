import { AppError } from "../../shared/errors/app-error.js";

export class FileValidationError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    // 413 for size limit, 415 for unsupported media, 400 for bad signature/generic
    const status = code === "FILE_TOO_LARGE" ? 413 : code === "UNSUPPORTED_FILE_TYPE" ? 415 : 400;
    super(status, code, message, details);
    this.name = "FileValidationError";
  }
}

export class DuplicateDocumentError extends AppError {
  constructor(
    message = "This document has already been uploaded to this bid.",
    details?: { bidId: string; sha256: string }
  ) {
    super(409, "DUPLICATE_DOCUMENT", message, details);
    this.name = "DuplicateDocumentError";
  }
}

export class DocumentNotFoundError extends AppError {
  constructor(documentId: string) {
    super(404, "NOT_FOUND", `Document with ID '${documentId}' was not found`);
    this.name = "DocumentNotFoundError";
  }
}

export class DocumentInvalidTransitionError extends AppError {
  constructor(currentStatus: string, requestedStatus: string) {
    super(
      409,
      "DOCUMENT_INVALID_STATE_TRANSITION",
      `Cannot transition document from '${currentStatus}' to '${requestedStatus}'. Illegal state transition.`
    );
    this.name = "DocumentInvalidTransitionError";
  }
}

export class DocumentNotDeletableError extends AppError {
  constructor(reason: string) {
    super(409, "DOCUMENT_NOT_DELETABLE", `Document cannot be deleted: ${reason}`);
    this.name = "DocumentNotDeletableError";
  }
}

export class DocumentNotRetryableError extends AppError {
  constructor(currentStatus: string) {
    super(
      409,
      "DOCUMENT_NOT_RETRYABLE",
      `Only documents in 'FAILED' state can be retried. Current status is '${currentStatus}'.`
    );
    this.name = "DocumentNotRetryableError";
  }
}
