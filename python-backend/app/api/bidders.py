from flask import Blueprint, request, g
from app.security.decorators import jwt_required
from app.utils.response import success_response, error_response
from app.models.models import Bidder
from app.services.bid_service import create_bidder, get_bidder, BidDomainError, bidder_dict

bidders_bp = Blueprint("bidders", __name__)

@bidders_bp.post("/bidders")
@jwt_required
def create():
    try:
        return success_response(create_bidder(g.current_org_id, request.get_json() or {}), 201)
    except BidDomainError as e:
        return error_response(e.code, e.message, e.status_code)

@bidders_bp.get("/bidders")
@jwt_required
def list_all():
    return success_response([bidder_dict(b) for b in Bidder.query.filter_by(organization_id=g.current_org_id).order_by(Bidder.legal_name).all()])

@bidders_bp.get("/bidders/<string:bidder_id>")
@jwt_required
def detail(bidder_id):
    try:
        return success_response(get_bidder(bidder_id, g.current_org_id))
    except BidDomainError as e:
        return error_response(e.code, e.message, e.status_code)
