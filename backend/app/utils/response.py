import uuid
from flask import jsonify, g, request

def get_request_id():
    if hasattr(g, 'request_id') and g.request_id:
        return g.request_id
    req_id = request.headers.get("X-Request-ID", f"REQ-{uuid.uuid4().hex[:8].upper()}")
    g.request_id = req_id
    return req_id

def api_success(data=None, status_code=200, headers=None):
    payload = {
        "success": True,
        "data": data if data is not None else {},
        "request_id": get_request_id()
    }
    return jsonify(payload), status_code, headers or {}

def api_error(code="INTERNAL_ERROR", message="An error occurred", status_code=400, details=None, headers=None):
    error_payload = {
        "code": code,
        "message": message
    }
    if details is not None:
        error_payload["details"] = details

    payload = {
        "success": False,
        "error": error_payload,
        "request_id": get_request_id()
    }
    return jsonify(payload), status_code, headers or {}
