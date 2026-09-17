from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.security.decorators import jwt_required
from app.services.bid_service import (
    create_bid,
    list_bids,
    list_all_bids,
    get_bid,
    BidDomainError,
)

bids_bp = Blueprint("bids", __name__)


@bids_bp.route("/bids", methods=["GET"])
@jwt_required
def get_all_bids():
    """List all bids across all tenders for the caller's organization."""
    try:
        return success_response({"bids": list_all_bids(g.current_org_id)})
    except BidDomainError as e:
        return error_response(e.code, e.message, e.status_code)


@bids_bp.route("/tenders/<string:tender_id>/bids", methods=["GET"])
@jwt_required
def get_bids_for_tender(tender_id):
    try:
        return success_response({"tender_id": tender_id, "bids": list_bids(tender_id, g.current_org_id)})
    except BidDomainError as e:
        return error_response(e.code, e.message, e.status_code)


@bids_bp.route("/tenders/<string:tender_id>/bids", methods=["POST"])
@jwt_required
def submit_bid(tender_id):
    try:
        return success_response(create_bid(tender_id, g.current_org_id, request.get_json() or {}), 201)
    except BidDomainError as e:
        return error_response(e.code, e.message, e.status_code)


@bids_bp.route("/bids/<string:bid_id>", methods=["GET"])
@bids_bp.route("/tenders/<string:tender_id>/bids/<string:bid_id>", methods=["GET"])
@jwt_required
def get_bid_detail(bid_id, tender_id=None):
    try:
        return success_response(get_bid(bid_id, g.current_org_id))
    except BidDomainError as e:
        return error_response(e.code, e.message, e.status_code)
