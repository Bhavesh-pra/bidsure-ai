import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BidStatus } from "@prisma/client";
import {
  isValidBidTransition,
  assertValidBidTransition,
  isEditableBidStatus,
  ALLOWED_BID_TRANSITIONS,
} from "../src/modules/bids/bid.state-machine.js";
import { BidInvalidStateTransitionError } from "../src/modules/bids/bid.errors.js";

describe("Phase 07 — Bid State Machine & Lifecycle Invariants", () => {
  describe("1. Legal Lifecycle Transitions", () => {
    it("allows DRAFT -> SUBMITTED (explicit submit)", () => {
      assert.equal(isValidBidTransition(BidStatus.DRAFT, BidStatus.SUBMITTED), true);
      assert.doesNotThrow(() => {
        assertValidBidTransition(BidStatus.DRAFT, BidStatus.SUBMITTED);
      });
    });

    it("allows SUBMITTED -> PROCESSING (background worker readiness)", () => {
      assert.equal(isValidBidTransition(BidStatus.SUBMITTED, BidStatus.PROCESSING), true);
      assert.doesNotThrow(() => {
        assertValidBidTransition(BidStatus.SUBMITTED, BidStatus.PROCESSING);
      });
    });

    it("allows PROCESSING -> UNDER_REVIEW and PROCESSING -> CLARIFICATION_REQUIRED", () => {
      assert.equal(isValidBidTransition(BidStatus.PROCESSING, BidStatus.UNDER_REVIEW), true);
      assert.equal(isValidBidTransition(BidStatus.PROCESSING, BidStatus.CLARIFICATION_REQUIRED), true);
    });

    it("allows CLARIFICATION_REQUIRED -> PROCESSING", () => {
      assert.equal(isValidBidTransition(BidStatus.CLARIFICATION_REQUIRED, BidStatus.PROCESSING), true);
    });

    it("allows UNDER_REVIEW -> READY_FOR_DECISION", () => {
      assert.equal(isValidBidTransition(BidStatus.UNDER_REVIEW, BidStatus.READY_FOR_DECISION), true);
    });

    it("allows READY_FOR_DECISION -> DECIDED", () => {
      assert.equal(isValidBidTransition(BidStatus.READY_FOR_DECISION, BidStatus.DECIDED), true);
    });

    it("allows DECIDED -> ARCHIVED", () => {
      assert.equal(isValidBidTransition(BidStatus.DECIDED, BidStatus.ARCHIVED), true);
    });
  });

  describe("2. Illegal Transitions (Must Fail with 409 Conflict)", () => {
    it("rejects SUBMITTED -> DRAFT", () => {
      assert.equal(isValidBidTransition(BidStatus.SUBMITTED, BidStatus.DRAFT), false);
      assert.throws(
        () => assertValidBidTransition(BidStatus.SUBMITTED, BidStatus.DRAFT),
        (err: unknown) => {
          assert.ok(err instanceof BidInvalidStateTransitionError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, "BID_INVALID_STATE_TRANSITION");
          return true;
        }
      );
    });

    it("rejects PROCESSING -> DRAFT", () => {
      assert.equal(isValidBidTransition(BidStatus.PROCESSING, BidStatus.DRAFT), false);
      assert.throws(() => assertValidBidTransition(BidStatus.PROCESSING, BidStatus.DRAFT));
    });

    it("rejects PROCESSING -> SUBMITTED", () => {
      assert.equal(isValidBidTransition(BidStatus.PROCESSING, BidStatus.SUBMITTED), false);
      assert.throws(() => assertValidBidTransition(BidStatus.PROCESSING, BidStatus.SUBMITTED));
    });

    it("rejects UNDER_REVIEW -> DRAFT", () => {
      assert.equal(isValidBidTransition(BidStatus.UNDER_REVIEW, BidStatus.DRAFT), false);
      assert.throws(() => assertValidBidTransition(BidStatus.UNDER_REVIEW, BidStatus.DRAFT));
    });

    it("rejects READY_FOR_DECISION -> DRAFT", () => {
      assert.equal(isValidBidTransition(BidStatus.READY_FOR_DECISION, BidStatus.DRAFT), false);
      assert.throws(() => assertValidBidTransition(BidStatus.READY_FOR_DECISION, BidStatus.DRAFT));
    });

    it("rejects DECIDED -> DRAFT", () => {
      assert.equal(isValidBidTransition(BidStatus.DECIDED, BidStatus.DRAFT), false);
      assert.throws(() => assertValidBidTransition(BidStatus.DECIDED, BidStatus.DRAFT));
    });

    it("rejects ARCHIVED -> DRAFT and ARCHIVED -> SUBMITTED", () => {
      assert.equal(isValidBidTransition(BidStatus.ARCHIVED, BidStatus.DRAFT), false);
      assert.equal(isValidBidTransition(BidStatus.ARCHIVED, BidStatus.SUBMITTED), false);
      assert.throws(() => assertValidBidTransition(BidStatus.ARCHIVED, BidStatus.DRAFT));
      assert.throws(() => assertValidBidTransition(BidStatus.ARCHIVED, BidStatus.SUBMITTED));
    });

    it("rejects self-transitions (DRAFT -> DRAFT, SUBMITTED -> SUBMITTED)", () => {
      assert.equal(isValidBidTransition(BidStatus.DRAFT, BidStatus.DRAFT), false);
      assert.equal(isValidBidTransition(BidStatus.SUBMITTED, BidStatus.SUBMITTED), false);
      assert.throws(() => assertValidBidTransition(BidStatus.DRAFT, BidStatus.DRAFT));
      assert.throws(() => assertValidBidTransition(BidStatus.SUBMITTED, BidStatus.SUBMITTED));
    });
  });

  describe("3. Draft Mutability Invariant (isEditableBidStatus)", () => {
    it("returns true ONLY for DRAFT status", () => {
      assert.equal(isEditableBidStatus(BidStatus.DRAFT), true);
    });

    it("returns false for SUBMITTED, PROCESSING, UNDER_REVIEW, and all terminal states", () => {
      assert.equal(isEditableBidStatus(BidStatus.SUBMITTED), false);
      assert.equal(isEditableBidStatus(BidStatus.PROCESSING), false);
      assert.equal(isEditableBidStatus(BidStatus.UNDER_REVIEW), false);
      assert.equal(isEditableBidStatus(BidStatus.CLARIFICATION_REQUIRED), false);
      assert.equal(isEditableBidStatus(BidStatus.READY_FOR_DECISION), false);
      assert.equal(isEditableBidStatus(BidStatus.DECIDED), false);
      assert.equal(isEditableBidStatus(BidStatus.ARCHIVED), false);
      assert.equal(isEditableBidStatus(BidStatus.ACCEPTED), false);
      assert.equal(isEditableBidStatus(BidStatus.REJECTED), false);
    });
  });
});
