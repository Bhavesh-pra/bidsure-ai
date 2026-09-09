import os
from flask import Flask
from flask_cors import CORS
from app.config import config_by_name
from app.models import db
from app.api import v1_bp

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "dev")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    app.register_blueprint(v1_bp)

    return app
