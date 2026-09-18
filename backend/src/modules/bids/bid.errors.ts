import { AppError, NotFoundError, ValidationError } from "../../shared/errors/app-error.js";

export class BidNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Bid with ID ${id} was not found`);
    this.name = "BidNotFoundError";
  }
}

export class BidNotEditableError extends AppError {
  constructor(status: string, message?: string) {
    super(
      409,
      "BID_NOT_EDITABLE",
      message || `Bid cannot be modified because it is in '${status}' state. Only DRAFT bids may be edited.`
    );
    this.name = "BidNotEditableError";
  }
}

export class BidInvalidStateTransitionError extends AppError {
  constructor(fromStatus: string, toStatus: string, reason?: string) {
    super(
      409,
      "BID_INVALID_STATE_TRANSITION",
      reason || `Illegal lifecycle transition: Cannot move bid from '${fromStatus}' to '${toStatus}'`
    );
    this.name = "BidInvalidStateTransitionError";
  }
}

export class BidTenderVersionMismatchError extends ValidationError {
  constructor(tenderId: string, tenderVersionId: string, actualTenderId?: string) {
    const fromTender = actualTenderId || "another tender";
    super(
      `Cross-tender version violation: TenderVersion ${tenderVersionId} belongs to Tender ${fromTender}, not Tender ${tenderId}`,
      [
        {
          field: "tenderVersionId",
          message: `TenderVersion ${tenderVersionId} does not belong to Tender ${tenderId}`,
        },
      ]
    );
    this.name = "BidTenderVersionMismatchError";
  }
}

export class BidTenderVersionInvalidError extends ValidationError {
  constructor(tenderVersionId: string, reason?: string) {
    super(
      reason || `Tender version ${tenderVersionId} is not valid or not available for bidding`,
      [
        {
          field: "tenderVersionId",
          message: reason || `Tender version ${tenderVersionId} is not valid`,
        },
      ]
    );
    this.name = "BidTenderVersionInvalidError";
  }
}

export class BidSubmissionNotAllowedError extends AppError {
  constructor(reason: string) {
    super(403, "BID_SUBMISSION_NOT_ALLOWED", reason);
    this.name = "BidSubmissionNotAllowedError";
  }
}

export class BidConcurrencyConflictError extends AppError {
  constructor(expectedVersion: number, actualVersion: number) {
    super(
      409,
      "BID_CONCURRENCY_CONFLICT",
      `Concurrent modification conflict: Expected version ${expectedVersion} but found version ${actualVersion}. Please refresh and retry.`
    );
    this.name = "BidConcurrencyConflictError";
  }
}

export class BidAlreadyExistsError extends AppError {
  constructor(tenderId: string, bidderId: string) {
    super(
      409,
      "BID_ALREADY_EXISTS",
      `A bid proposal has already been created by this bidder for Tender ${tenderId}`
    );
    this.name = "BidAlreadyExistsError";
  }
}

export class BidderImpersonationError extends AppError {
  constructor(targetBidderId: string, actorBidderId?: string | null) {
    super(
      403,
      "BIDDER_IMPERSONATION_FORBIDDEN",
      `Forbidden: Actor is not authorized to act on behalf of bidder ${targetBidderId}`
    );
    this.name = "BidderImpersonationError";
  }
}

export class CrossTenantAccessDeniedError extends AppError {
  constructor(message = "Cross-tenant access is strictly denied") {
    super(403, "CROSS_TENANT_ACCESS_DENIED", message);
    this.name = "CrossTenantAccessDeniedError";
  }
}
