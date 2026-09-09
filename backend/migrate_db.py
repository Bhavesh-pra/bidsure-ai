import logging
from sqlalchemy import text, inspect
from app import create_app
from app.models.models import db
from app.services.seed_service import seed_demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_migration")

def migrate_and_seed():
    app = create_app("development")
    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        logger.info("Found existing tables: %s", tables)

        if "users" in tables:
            user_columns = [c["name"] for c in inspector.get_columns("users")]
            if "actor_type" not in user_columns:
                logger.info("Adding actor_type column to users table...")
                db.session.execute(text("ALTER TABLE users ADD COLUMN actor_type VARCHAR(30) NOT NULL DEFAULT 'GOVERNMENT';"))
                db.session.commit()
                logger.info("Added actor_type to users.")
            else:
                logger.info("users.actor_type already exists.")

        if "organizations" in tables:
            org_columns = [c["name"] for c in inspector.get_columns("organizations")]
            if "type" not in org_columns:
                logger.info("Adding type column to organizations table...")
                db.session.execute(text("ALTER TABLE organizations ADD COLUMN type VARCHAR(30) NOT NULL DEFAULT 'GOVERNMENT';"))
                db.session.commit()
                logger.info("Added type to organizations.")
            else:
                logger.info("organizations.type already exists.")

        db.create_all()
        logger.info("Running seed_demo_data...")
        stats = seed_demo_data()
        logger.info("Seed complete: %s", stats)

if __name__ == "__main__":
    migrate_and_seed()
