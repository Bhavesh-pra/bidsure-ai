from flask import Blueprint, request
from app.utils.response import success_response, error_response

tenders_bp = Blueprint("tenders", __name__)

@tenders_bp.route("/tenders", methods=["GET"])
def get_tenders():
    # Stubbed for Cycle 1 contract compliance
    return success_response({
        "tenders": [
            {
                "id": "TND-GEM-2026-001",
                "tender_number": "GEM/2026/B/1001",
                "title": "Supply of Server Infrastructure",
                "entity": "Ministry of Electronics & IT",
                "category": "EQUIPMENT",
                "status": "PUBLISHED"
            }
        ]
    })

@tenders_bp.route("/tenders", methods=["POST"])
def create_tender():
    data = request.get_json() or {}
    if not data.get("tender_number") or not data.get("title"):
        return error_response("INVALID_REQUEST", "tender_number and title are required fields", 400)
    
    return success_response({
        "id": "TND-GEM-2026-002",
        "tender_number": data.get("tender_number"),
        "title": data.get("title"),
        "status": "DRAFT"
    }, 201)

@tenders_bp.route("/tenders/<string:tender_id>", methods=["GET"])
def get_tender_detail(tender_id):
    return success_response({
        "id": tender_id,
        "tender_number": "GEM/2026/B/1001",
        "title": "Supply of Server Infrastructure",
        "entity": "Ministry of Electronics & IT",
        "category": "EQUIPMENT",
        "status": "PUBLISHED"
    })
