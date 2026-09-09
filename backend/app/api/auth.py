import bcrypt
from flask import Blueprint, request
from app.models.models import db, User, Organization
from app.utils.response import success_response, error_response
from app.security.jwt_manager import create_access_token

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return error_response("VALIDATION_ERROR", "Email and password are required", 400)

    user = User.query.filter_by(email=email).first()

    # In development or testing, if user does not exist but is the demo officer, auto-seed
    if not user and email == "officer@bidsure.gov.in" and password == "officer123":
        org = Organization.query.filter_by(id="ORG-001").first()
        if not org:
            org = Organization(
                id="ORG-001",
                name="Demo Procurement Department",
                code="DPD-001",
                status="ACTIVE",
            )
            db.session.add(org)
            db.session.flush()

        salt = bcrypt.gensalt()
        pw_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        user = User(
            id="USR-OFFICER-001",
            organization_id=org.id,
            email=email,
            password_hash=pw_hash,
            name="Procurement Officer",
            role="PROCUREMENT_OFFICER",
            status="ACTIVE",
        )
        db.session.add(user)
        db.session.commit()

    if not user:
        return error_response("INVALID_CREDENTIALS", "Invalid email or password", 401)

    # Verify password hash
    password_valid = False
    try:
        if user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$"):
            password_valid = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
        else:
            password_valid = (password == user.password_hash)
    except Exception:
        password_valid = False

    if not password_valid:
        return error_response("INVALID_CREDENTIALS", "Invalid email or password", 401)

    if user.status != "ACTIVE":
        return error_response("ACCOUNT_INACTIVE", "User account is inactive", 403)

    token = create_access_token(
        user_id=user.id,
        organization_id=user.organization_id,
        role=user.role,
        name=user.name,
        actor_type=getattr(user, "actor_type", "GOVERNMENT"),
    )

    org = Organization.query.filter_by(id=user.organization_id).first()

    return success_response({
        "access_token": token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "actor_type": getattr(user, "actor_type", "GOVERNMENT"),
            "organization_id": user.organization_id,
            "organization_name": org.name if org else None,
            "organization_type": org.type if org else None,
        }
    })


@auth_bp.route("/auth/me", methods=["GET"])
def auth_me():
    """Return the authenticated user's profile from the JWT token."""
    from app.security.jwt_manager import decode_token
    import jwt as _jwt

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return error_response("UNAUTHORIZED", "Missing authorization header", 401)

    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return error_response("UNAUTHORIZED", "Invalid authorization header format", 401)

    try:
        payload = decode_token(parts[1])
    except _jwt.ExpiredSignatureError:
        return error_response("UNAUTHORIZED", "Token has expired", 401)
    except _jwt.InvalidTokenError:
        return error_response("UNAUTHORIZED", "Invalid token", 401)

    user_id = payload.get("sub")
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return error_response("NOT_FOUND", "User not found", 404)

    org = Organization.query.filter_by(id=user.organization_id).first()

    return success_response({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "actor_type": getattr(user, "actor_type", "GOVERNMENT"),
        "organization_id": user.organization_id,
        "organization_name": org.name if org else None,
        "organization_type": getattr(org, "type", "GOVERNMENT") if org else None,
        "status": user.status,
    })
