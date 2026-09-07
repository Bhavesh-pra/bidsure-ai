from datetime import datetime
from flask import Blueprint
from app.utils.response import success_response

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    return success_response({
        "status": "healthy",
        "service": "BidSure AI Modular Monolith API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
