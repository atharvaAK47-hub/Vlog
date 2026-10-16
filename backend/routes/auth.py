from functools import wraps
import re
from flask import Blueprint, request, jsonify, session
from backend.extensions import db
from backend.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        user = User.query.get(user_id)
        if not user:
            session.pop('user_id', None)
            return jsonify({'error': 'Session invalid, please log in again'}), 401
        return f(user, *args, **kwargs)
    return decorated_function

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters long'}), 400
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({'error': 'A valid email address is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    if confirm_password and password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email address already registered'}), 409
        
    user = User(
        username=username,
        email=email,
        bio=data.get('bio', ''),
        profile_image=data.get('profile_image', '')
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict(include_email=True)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401
        
    session['user_id'] = user.id
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(include_email=True)
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'user': None}), 200
    user = User.query.get(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'user': None}), 200
    return jsonify({'user': user.to_dict(include_email=True)}), 200
