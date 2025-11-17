from flask import session, jsonify
from functools import wraps
from flask_mysqldb import MySQL

mysql = MySQL()

def log_action(action, user_id=None, details=None):
    """Log system actions to database"""
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO logs (action, user_id, details) VALUES (%s, %s, %s)",
            (action, user_id, details)
        )
        mysql.connection.commit()
        cur.close()
    except Exception as e:
        print(f"Logging error: {e}")

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Authentication required'}), 401
            if session.get('role') != role:
                return jsonify({'error': 'Unauthorized access'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    """Get current user from session"""
    if 'user_id' not in session:
        return None
    
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, name, email, role, has_voted FROM users WHERE id = %s", (session['user_id'],))
        user = cur.fetchone()
        cur.close()
        return user
    except:
        return None