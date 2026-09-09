from flask import Blueprint, request
from app.models import db, Tender
from app.utils.response import api_success, api_error

tenders_bp = Blueprint("tenders", __name__)

@tenders_bp.route("/tenders", methods=["GET"])
def list_tenders():
    tenders = Tender.query.all()
    return api_success([t.to_dict() for t in tenders])

@tenders_bp.route("/tenders/<string:tender_id>", methods=["GET"])
def get_tender(tender_id):
    tender = Tender.query.get(tender_id)
    if not tender:
        return api_error(code="TENDER_NOT_FOUND", message=f"Tender {tender_id} not found", status_code=404)
    return api_success(tender.to_dict())
