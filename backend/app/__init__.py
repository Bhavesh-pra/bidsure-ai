import os
from flask import Flask
from werkzeug.exceptions import RequestEntityTooLarge
from app.utils.response import error_response
from flask_cors import CORS
from app.config import config_by_name
from app.models.models import db

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    @app.errorhandler(RequestEntityTooLarge)
    def handle_oversized_upload(_error):
        return error_response("VALIDATION_ERROR", "Uploaded file exceeds the maximum allowed size", 413)

    # Initialize extensions
    CORS(app)
    db.init_app(app)

    try:
        from flask_migrate import Migrate
        migrate = Migrate()
        migrate.init_app(app, db)
    except ImportError:
        pass

    # Register blueprints
    from app.api.health import health_bp
    from app.api.auth import auth_bp
    from app.api.tenders import tenders_bp
    from app.api.documents import documents_bp
    from app.api.rules import rules_bp
    from app.api.bids import bids_bp
    from app.api.bidders import bidders_bp
    from app.api.bid_documents import bid_documents_bp
    from app.api.evidence import evidence_bp

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/api/v1")
    app.register_blueprint(tenders_bp, url_prefix="/api/v1")
    app.register_blueprint(documents_bp, url_prefix="/api/v1")
    app.register_blueprint(rules_bp, url_prefix="/api/v1")
    app.register_blueprint(bids_bp, url_prefix="/api/v1")
    app.register_blueprint(bidders_bp, url_prefix="/api/v1")
    app.register_blueprint(bid_documents_bp, url_prefix="/api/v1")
    app.register_blueprint(evidence_bp, url_prefix="/api/v1")

    # Create tables in development mode if database exists
    with app.app_context():
        try:
            db.create_all()
        except Exception:
            pass  # Will handle via migrations / active DB connection later

    return app
