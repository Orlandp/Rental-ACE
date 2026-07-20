from functools import wraps
from flask import session, jsonify
#login details.
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
           return jsonify({'error': 'you are not logged in'}), 401
        return f(*args, **kwargs)
    return wrapper
#roles for the login.

def role_required(*allowed_roles):
    def defactor(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'The page is not workinh'}), 401
            if session['role'] not in allowed_roles:
                return jsonify({'error': 'you are not allowed'}), 403
            return f(*args, **kwargs)
        return wrapper
    return defactor
