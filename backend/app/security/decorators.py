from functools import wraps
from flask import request, g
import jwt
from app.utils.response import error_response
from app.security.jwt_manager import decode_token

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return error_response("UNAUTHORIZED", "Missing authorization header", 401)

        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return error_response("UNAUTHORIZED", "Invalid authorization header format. Expected 'Bearer <token>'", 401)

        token = parts[1]
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return error_response("UNAUTHORIZED", "Token has expired", 401)
        except jwt.InvalidTokenError as e:
            return error_response("UNAUTHORIZED", f"Invalid token: {str(e)}", 401)
        except Exception:
            return error_response("UNAUTHORIZED", "Authentication failed", 401)

        # Store authenticated context on Flask's g object
        g.current_user = {
            "id": payload.get("sub"),
            "organization_id": payload.get("org_id"),
            "role": payload.get("role"),
            "name": payload.get("name"),
        }
        g.current_org_id = payload.get("org_id")

        return f(*args, **kwargs)

    return decorated_function


def roles_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                return error_response("UNAUTHORIZED", "Authentication required", 401)

            user_role = g.current_user.get("role")
            if user_role not in allowed_roles and user_role != "ADMIN":
                return error_response(
                    "FORBIDDEN",
                    f"Role '{user_role}' is not authorized to access this resource",
                    403,
                )
            return f(*args, **kwargs)

        return decorated_function

    return decorator
