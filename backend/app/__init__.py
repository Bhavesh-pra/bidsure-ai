import os
from flask import Flask
from flask_cors import CORS
from app.config import config_by_name
from app.models.models import db

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

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
    from app.api.tenders import tenders_bp
    from app.api.bids import bids_bp

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(tenders_bp, url_prefix="/api/v1")
    app.register_blueprint(bids_bp, url_prefix="/api/v1")

    # Create tables in development mode if database exists
    with app.app_context():
        try:
            db.create_all()
        except Exception:
            pass  # Will handle via migrations / active DB connection later

    return app
