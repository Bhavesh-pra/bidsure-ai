import jwt
from datetime import datetime, timezone, timedelta
from flask import current_app

def create_access_token(
    user_id: str,
    organization_id: str,
    role: str = "PROCUREMENT_OFFICER",
    name: str = "",
    actor_type: str = "GOVERNMENT",
    expires_in_minutes: int = None,
) -> str:
    """Generate a signed JWT token with standard subject and tenant claims."""
    secret_key = current_app.config.get("JWT_SECRET_KEY", "jwt-dev-secret-key-bidsure-2026")
    
    if expires_in_minutes is None:
        delta = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES", timedelta(minutes=60))
        if isinstance(delta, timedelta):
            exp = datetime.now(timezone.utc) + delta
        else:
            exp = datetime.now(timezone.utc) + timedelta(minutes=int(delta))
    else:
        exp = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)

    payload = {
        "sub": str(user_id),
        "org_id": str(organization_id),
        "role": str(role),
        "actor_type": str(actor_type),
        "name": name or "",
        "iat": datetime.now(timezone.utc),
        "exp": exp,
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token against the app secret key."""
    secret_key = current_app.config.get("JWT_SECRET_KEY", "jwt-dev-secret-key-bidsure-2026")
    return jwt.decode(token, secret_key, algorithms=["HS256"])
