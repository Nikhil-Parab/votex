from flask import Blueprint, request, jsonify, session
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
from utils.helpers import log_action, login_required

auth_bp = Blueprint('auth', __name__)
mysql = MySQL()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'voter')
    
    if not all([name, email, password]):
        return jsonify({'error': 'All fields are required'}), 400
    
    if role not in ['voter', 'party']:
        return jsonify({'error': 'Invalid role'}), 400
    
    try:
        cur = mysql.connection.cursor()
        
        # Check if email exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        password_hash = generate_password_hash(password)
        cur.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (name, email, password_hash, role)
        )
        mysql.connection.commit()
        user_id = cur.lastrowid
        cur.close()
        
        log_action(f'{role.capitalize()} registered', user_id, f'Email: {email}')
        
        return jsonify({
            'success': True,
            'message': 'Registration successful'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'error': 'Email and password required'}), 400
    
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, name, email, password_hash, role, has_voted FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Set session
        session.permanent = True
        session['user_id'] = user['id']
        session['name'] = user['name']
        session['email'] = user['email']
        session['role'] = user['role']
        session['has_voted'] = user['has_voted']
        
        log_action(f'User logged in', user['id'], f'Email: {email}')
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'hasVoted': user['has_voted']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    user_id = session.get('user_id')
    email = session.get('email')
    
    log_action('User logged out', user_id, f'Email: {email}')
    
    session.clear()
    
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@auth_bp.route('/session', methods=['GET'])
def get_session():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'name': session['name'],
                'email': session['email'],
                'role': session['role'],
                'hasVoted': session.get('has_voted', False)
            }
        }), 200
    else:
        return jsonify({'authenticated': False}), 200