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
    from app.api.verification import verification_bp
    from app.api.decision import decision_bp

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/api/v1")
    app.register_blueprint(tenders_bp, url_prefix="/api/v1")
    app.register_blueprint(documents_bp, url_prefix="/api/v1")
    app.register_blueprint(rules_bp, url_prefix="/api/v1")
    app.register_blueprint(bids_bp, url_prefix="/api/v1")
    app.register_blueprint(bidders_bp, url_prefix="/api/v1")
    app.register_blueprint(bid_documents_bp, url_prefix="/api/v1")
    app.register_blueprint(evidence_bp, url_prefix="/api/v1")
    app.register_blueprint(verification_bp, url_prefix="/api/v1")
    app.register_blueprint(decision_bp, url_prefix="/api/v1")

    # Add root /auth/login route so both /auth/login and /api/v1/auth/login work
    from app.api.auth import login as auth_login
    app.add_url_rule("/auth/login", endpoint="auth_login_root", view_func=auth_login, methods=["POST"])

    # Create tables in development mode if database exists, auto-patch schema columns, and seed baseline demo data
    with app.app_context():
        try:
            from sqlalchemy import inspect as _inspect, text as _text
            inspector = _inspect(db.engine)
            tables = inspector.get_table_names()
            if "users" in tables:
                cols = [c["name"] for c in inspector.get_columns("users")]
                if "actor_type" not in cols:
                    db.session.execute(_text("ALTER TABLE users ADD COLUMN actor_type VARCHAR(30) NOT NULL DEFAULT 'GOVERNMENT';"))
                    db.session.commit()
            if "organizations" in tables:
                cols = [c["name"] for c in inspector.get_columns("organizations")]
                if "type" not in cols:
                    db.session.execute(_text("ALTER TABLE organizations ADD COLUMN type VARCHAR(30) NOT NULL DEFAULT 'GOVERNMENT';"))
                    db.session.commit()
            db.create_all()
            if config_name == "development":
                from app.services.seed_service import seed_demo_data
                seed_demo_data()
        except Exception:
            pass

    return app
