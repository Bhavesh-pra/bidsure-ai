from flask import Blueprint
from .health import health_bp
from .tenders import tenders_bp
from .bids import bids_bp
from .documents import documents_bp

v1_bp = Blueprint("v1", __name__, url_prefix="/api/v1")
v1_bp.register_blueprint(health_bp)
v1_bp.register_blueprint(tenders_bp)
v1_bp.register_blueprint(bids_bp)
v1_bp.register_blueprint(documents_bp)

__all__ = ["v1_bp"]
