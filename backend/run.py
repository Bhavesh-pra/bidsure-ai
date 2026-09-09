import os
from app import create_app
from init_db import init_database

app = create_app(os.getenv("FLASK_ENV", "dev"))

if __name__ == "__main__":
    init_database()
    app.run(host="0.0.0.0", port=5000, debug=True)
