from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, login_required, current_user
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import json
import google.generativeai as genai
from config import Config

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# Configure Gemini AI
genai.configure(api_key=app.config['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-pro')

# Configure extensions first
db.init_app(app)

# Import models after db is configured
from models import User, Class, Enrollment, Quiz, QuizResult, Battle, Badge

# Import routes
from routes.auth import auth_bp
from routes.teacher import teacher_bp
from routes.student import student_bp
from routes.battle import battle_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(teacher_bp, url_prefix='/teacher')
app.register_blueprint(student_bp, url_prefix='/student')
app.register_blueprint(battle_bp, url_prefix='/battle')

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return jsonify({'message': 'Gamified Learning System API', 'status': 'running'})

# Socket.IO events for real-time battles
@socketio.on('join_battle')
def on_join_battle(data):
    battle_id = data['battle_id']
    user_id = data['user_id']
    join_room(f'battle_{battle_id}')
    emit('user_joined', {'user_id': user_id}, room=f'battle_{battle_id}')

@socketio.on('submit_answer')
def on_submit_answer(data):
    battle_id = data['battle_id']
    user_id = data['user_id']
    answer = data['answer']
    question_index = data['question_index']
    
    # Process answer and update battle state
    battle = Battle.query.get(battle_id)
    if battle:
        # Update battle scores (implementation depends on your scoring logic)
        emit('answer_submitted', {
            'user_id': user_id,
            'question_index': question_index,
            'correct': True  # Replace with actual answer checking
        }, room=f'battle_{battle_id}')

@socketio.on('leave_battle')
def on_leave_battle(data):
    battle_id = data['battle_id']
    user_id = data['user_id']
    leave_room(f'battle_{battle_id}')
    emit('user_left', {'user_id': user_id}, room=f'battle_{battle_id}')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)