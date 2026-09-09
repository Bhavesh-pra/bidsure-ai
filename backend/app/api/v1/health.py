from flask import Blueprint
from app.utils.response import api_success

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    return api_success({"status": "healthy"})
