from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Class, Enrollment
import string
import random

auth_bp = Blueprint('auth', __name__)

def generate_class_code():
    """Generate a unique 6-character class code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Class.query.filter_by(code=code).first():
            return code

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate role
        if data['role'] not in ['teacher', 'student']:
            return jsonify({'error': 'Role must be either teacher or student'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            role=data['role']
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        # If teacher, create a default class
        if user.role == 'teacher':
            default_class = Class(
                name=f"{user.name}'s Class",
                description="Default class",
                teacher_id=user.id,
                code=generate_class_code()
            )
            db.session.add(default_class)
            db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        from datetime import datetime
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        # Login user for Flask-Login
        login_user(user)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        profile_data = user.to_dict()
        
        # Add additional data based on role
        if user.role == 'teacher':
            profile_data['classes'] = [cls.to_dict() for cls in user.classes_taught]
        else:
            profile_data['enrolled_classes'] = [cls.to_dict() for cls in user.get_enrolled_classes()]
            profile_data['level'] = user.level
        
        return jsonify({'user': profile_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/join-class', methods=['POST'])
@jwt_required()
def join_class():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'student':
            return jsonify({'error': 'Only students can join classes'}), 403
        
        data = request.get_json()
        class_code = data.get('class_code')
        
        if not class_code:
            return jsonify({'error': 'Class code is required'}), 400
        
        # Find class by code
        class_obj = Class.query.filter_by(code=class_code).first()
        if not class_obj:
            return jsonify({'error': 'Invalid class code'}), 404
        
        # Check if already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            class_id=class_obj.id,
            student_id=user.id
        ).first()
        
        if existing_enrollment:
            return jsonify({'error': 'Already enrolled in this class'}), 400
        
        # Create enrollment
        enrollment = Enrollment(
            class_id=class_obj.id,
            student_id=user.id
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully joined class',
            'class': class_obj.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401