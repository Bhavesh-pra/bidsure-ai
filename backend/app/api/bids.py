from flask import Blueprint, request
from app.utils.response import success_response, error_response

bids_bp = Blueprint("bids", __name__)

@bids_bp.route("/tenders/<string:tender_id>/bids", methods=["GET"])
def get_bids_for_tender(tender_id):
    return success_response({
        "tender_id": tender_id,
        "bids": [
            {
                "id": "BID-2026-001",
                "bidder_name": "ABC Technologies Pvt Ltd",
                "quoted_amount": 45000000.00,
                "status": "SUBMITTED"
            }
        ]
    })

@bids_bp.route("/tenders/<string:tender_id>/bids", methods=["POST"])
def submit_bid(tender_id):
    data = request.get_json() or {}
    if not data.get("quoted_amount"):
        return error_response("INVALID_REQUEST", "quoted_amount is required", 400)

    return success_response({
        "id": "BID-2026-002",
        "tender_id": tender_id,
        "quoted_amount": data.get("quoted_amount"),
        "status": "SUBMITTED"
    }, 201)

@bids_bp.route("/bids/<string:bid_id>", methods=["GET"])
def get_bid_detail(bid_id):
    return success_response({
        "id": bid_id,
        "tender_id": "TND-GEM-2026-001",
        "bidder_name": "ABC Technologies Pvt Ltd",
        "quoted_amount": 45000000.00,
        "status": "SUBMITTED"
    })
