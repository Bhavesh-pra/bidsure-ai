import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "bidsure-secret-key-change-in-production")
    JWT_SECRET = os.getenv("JWT_SECRET", "bidsure-jwt-secret-key")
    JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "bidsure-jwt-refresh-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "sqlite:///" + os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../bidsure_dev.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../uploads")
    )
    S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_BUCKET = os.getenv("S3_BUCKET", "bidsure-documents")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
    LLM_API_KEY = os.getenv("LLM_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    "dev": DevelopmentConfig,
    "test": TestingConfig,
    "prod": ProductionConfig,
    "default": DevelopmentConfig
}
