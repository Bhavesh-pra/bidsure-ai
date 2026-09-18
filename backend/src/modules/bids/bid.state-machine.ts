import { BidStatus } from "@prisma/client";
import { BidInvalidStateTransitionError } from "./bid.errors.js";

/**
 * Authoritative Bid Lifecycle State Machine.
 *
 * Formal lifecycle:
 *   DRAFT
 *     ↓
 *   SUBMITTED
 *     ↓
 *   PROCESSING
 *     ↓
 *   UNDER_REVIEW
 *     ↓
 *   READY_FOR_DECISION
 *     ↓
 *   DECIDED
 *     ↓
 *   ARCHIVED
 *
 * Additional branches:
 *   PROCESSING ⇄ CLARIFICATION_REQUIRED
 */
export const ALLOWED_BID_TRANSITIONS: Record<BidStatus, readonly BidStatus[]> = {
  DRAFT: [BidStatus.SUBMITTED],
  SUBMITTED: [BidStatus.PROCESSING],
  PROCESSING: [BidStatus.UNDER_REVIEW, BidStatus.CLARIFICATION_REQUIRED],
  CLARIFICATION_REQUIRED: [BidStatus.PROCESSING],
  UNDER_REVIEW: [BidStatus.READY_FOR_DECISION],
  READY_FOR_DECISION: [BidStatus.DECIDED],
  DECIDED: [BidStatus.ARCHIVED],
  ARCHIVED: [],
  // Legacy enum values preserved for backwards compatibility
  EVALUATED: [BidStatus.DECIDED, BidStatus.ACCEPTED, BidStatus.REJECTED],
  REJECTED: [BidStatus.ARCHIVED],
  ACCEPTED: [BidStatus.ARCHIVED],
};

/**
 * Validates whether a requested transition is legal under the state machine.
 */
export function isValidBidTransition(fromStatus: BidStatus, toStatus: BidStatus): boolean {
  if (fromStatus === toStatus) {
    return false; // No-op / self-transitions disallowed
  }
  const allowed = ALLOWED_BID_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

/**
 * Enforces legal state transition or throws BidInvalidStateTransitionError (409 Conflict).
 */
export function assertValidBidTransition(fromStatus: BidStatus, toStatus: BidStatus): void {
  if (!isValidBidTransition(fromStatus, toStatus)) {
    throw new BidInvalidStateTransitionError(
      fromStatus,
      toStatus,
      `Illegal lifecycle transition: Cannot transition Bid from '${fromStatus}' to '${toStatus}'.`
    );
  }
}

/**
 * Checks if a Bid in the given status allows draft metadata edits.
 * STRICT INVARIANT: Only DRAFT bids are mutable.
 */
export function isEditableBidStatus(status: BidStatus): boolean {
  return status === BidStatus.DRAFT;
}
