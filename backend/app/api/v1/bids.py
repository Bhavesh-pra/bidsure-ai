from flask import Blueprint
from app.models import db, Bid
from app.utils.response import api_success, api_error

bids_bp = Blueprint("bids", __name__)

@bids_bp.route("/bids", methods=["GET"])
def list_bids():
    bids = Bid.query.all()
    return api_success([b.to_dict() for b in bids])

@bids_bp.route("/bids/<string:bid_id>", methods=["GET"])
def get_bid(bid_id):
    bid = Bid.query.get(bid_id)
    if not bid:
        return api_error(code="BID_NOT_FOUND", message=f"Bid {bid_id} not found", status_code=404)
    return api_success(bid.to_dict())
