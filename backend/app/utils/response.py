import uuid
from datetime import datetime
from flask import jsonify, g

def get_request_id():
    if not hasattr(g, "request_id"):
        g.request_id = f"REQ-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    return g.request_id

def success_response(data=None, status_code=200):
    response_body = {
        "success": True,
        "data": data if data is not None else {},
        "request_id": get_request_id()
    }
    return jsonify(response_body), status_code

def error_response(code, message, status_code=400):
    response_body = {
        "success": False,
        "error": {
            "code": code,
            "message": message
        },
        "request_id": get_request_id()
    }
    return jsonify(response_body), status_code
