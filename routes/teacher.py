from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Class, Quiz, QuizResult, Badge, Enrollment
import json
import google.generativeai as genai
from datetime import datetime, timedelta
import random

teacher_bp = Blueprint('teacher', __name__)

def require_teacher():
    """Decorator to ensure user is a teacher"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'teacher':
        return None
    return user

@teacher_bp.route('/classes', methods=['GET'])
@jwt_required()
def get_classes():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        classes = [cls.to_dict() for cls in teacher.classes_taught]
        return jsonify({'classes': classes}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/class/create', methods=['POST'])
@jwt_required()
def create_class():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')
        
        if not name:
            return jsonify({'error': 'Class name is required'}), 400
        
        # Generate unique class code
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Class.query.filter_by(code=code).first():
                break
        
        new_class = Class(
            name=name,
            description=description,
            teacher_id=teacher.id,
            code=code
        )
        
        db.session.add(new_class)
        db.session.commit()
        
        return jsonify({
            'message': 'Class created successfully',
            'class': new_class.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/quiz/create', methods=['POST'])
@jwt_required()
def create_quiz():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'questions']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate questions format
        questions = data['questions']
        if not isinstance(questions, list) or len(questions) == 0:
            return jsonify({'error': 'Questions must be a non-empty array'}), 400
        
        # Validate each question
        for i, question in enumerate(questions):
            required_q_fields = ['question', 'options', 'correct_answer']
            for field in required_q_fields:
                if field not in question:
                    return jsonify({'error': f'Question {i+1} missing {field}'}), 400
        
        quiz = Quiz(
            title=data['title'],
            description=data.get('description', ''),
            questions=json.dumps(questions),
            created_by=teacher.id,
            class_id=data.get('class_id'),
            is_battle_enabled=data.get('is_battle_enabled', False),
            time_limit=data.get('time_limit', 300),
            xp_reward=data.get('xp_reward', 50)
        )
        
        db.session.add(quiz)
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz created successfully',
            'quiz': quiz.to_dict(include_answers=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/quiz/generate', methods=['POST'])
@jwt_required()
def generate_quiz_with_ai():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        data = request.get_json()
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'medium')
        num_questions = data.get('num_questions', 5)
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        # Generate quiz using Gemini AI
        prompt = f"""
        Generate a quiz about {topic} with the following specifications:
        - Difficulty level: {difficulty}
        - Number of questions: {num_questions}
        - Each question should be multiple choice with 4 options
        - Include the correct answer for each question
        
        Return the response in this exact JSON format:
        {{
            "title": "Quiz title",
            "description": "Brief description",
            "questions": [
                {{
                    "question": "Question text",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": 0
                }}
            ]
        }}
        
        Make sure the correct_answer is the index (0-3) of the correct option.
        """
        
        try:
            # Configure Gemini (assuming it's already configured in main app)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            
            # Parse the AI response
            quiz_data = json.loads(response.text)
            
            # Validate the generated quiz
            if 'questions' not in quiz_data or not quiz_data['questions']:
                return jsonify({'error': 'AI failed to generate valid questions'}), 500
            
            return jsonify({
                'message': 'Quiz generated successfully',
                'quiz_data': quiz_data
            }), 200
            
        except Exception as ai_error:
            return jsonify({'error': f'AI generation failed: {str(ai_error)}'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/student/<int:student_id>/progress', methods=['GET'])
@jwt_required()
def get_student_progress():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        student = User.query.get(student_id)
        if not student or student.role != 'student':
            return jsonify({'error': 'Student not found'}), 404
        
        # Check if student is in teacher's class
        teacher_classes = [cls.id for cls in teacher.classes_taught]
        student_classes = [enrollment.class_id for enrollment in student.enrollments]
        
        if not any(cls_id in teacher_classes for cls_id in student_classes):
            return jsonify({'error': 'Student not in your classes'}), 403
        
        # Get quiz results
        quiz_results = QuizResult.query.filter_by(student_id=student_id).all()
        
        # Calculate statistics
        total_quizzes = len(quiz_results)
        avg_score = sum(result.score for result in quiz_results) / total_quizzes if total_quizzes > 0 else 0
        total_xp = sum(result.xp_earned for result in quiz_results)
        
        # Get recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_results = [r for r in quiz_results if r.completed_at >= thirty_days_ago]
        
        progress_data = {
            'student': student.to_dict(),
            'statistics': {
                'total_quizzes': total_quizzes,
                'average_score': round(avg_score, 2),
                'total_xp': total_xp,
                'current_streak': student.streak,
                'level': student.level
            },
            'recent_results': [result.to_dict() for result in recent_results],
            'badges': [badge.to_dict() for badge in student.badges_earned]
        }
        
        return jsonify({'progress': progress_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/class/<int:class_id>/leaderboard', methods=['GET'])
@jwt_required()
def get_class_leaderboard():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        # Verify teacher owns this class
        class_obj = Class.query.get(class_id)
        if not class_obj or class_obj.teacher_id != teacher.id:
            return jsonify({'error': 'Class not found or access denied'}), 404
        
        # Get all students in the class
        enrollments = Enrollment.query.filter_by(class_id=class_id).all()
        students = [enrollment.student for enrollment in enrollments]
        
        # Create leaderboard data
        leaderboard = []
        for student in students:
            quiz_results = QuizResult.query.filter_by(student_id=student.id).all()
            avg_score = sum(result.score for result in quiz_results) / len(quiz_results) if quiz_results else 0
            
            leaderboard.append({
                'student': student.to_dict(),
                'total_xp': student.xp,
                'average_score': round(avg_score, 2),
                'quiz_count': len(quiz_results),
                'streak': student.streak,
                'level': student.level
            })
        
        # Sort by XP (primary) and average score (secondary)
        leaderboard.sort(key=lambda x: (x['total_xp'], x['average_score']), reverse=True)
        
        return jsonify({
            'class': class_obj.to_dict(),
            'leaderboard': leaderboard
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/badge/create', methods=['POST'])
@jwt_required()
def create_badge():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        data = request.get_json()
        
        required_fields = ['name', 'description', 'awarded_to']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify student exists and is in teacher's class
        student = User.query.get(data['awarded_to'])
        if not student or student.role != 'student':
            return jsonify({'error': 'Student not found'}), 404
        
        # Check if student is in teacher's classes
        teacher_classes = [cls.id for cls in teacher.classes_taught]
        student_classes = [enrollment.class_id for enrollment in student.enrollments]
        
        if not any(cls_id in teacher_classes for cls_id in student_classes):
            return jsonify({'error': 'Student not in your classes'}), 403
        
        badge = Badge(
            name=data['name'],
            description=data['description'],
            icon_url=data.get('icon_url'),
            criteria=json.dumps(data.get('criteria', {})),
            awarded_to=data['awarded_to'],
            generated_by='teacher'
        )
        
        db.session.add(badge)
        db.session.commit()
        
        return jsonify({
            'message': 'Badge created successfully',
            'badge': badge.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/ai-insights/<int:class_id>', methods=['GET'])
@jwt_required()
def get_ai_insights():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        # Verify teacher owns this class
        class_obj = Class.query.get(class_id)
        if not class_obj or class_obj.teacher_id != teacher.id:
            return jsonify({'error': 'Class not found or access denied'}), 404
        
        # Get class performance data
        enrollments = Enrollment.query.filter_by(class_id=class_id).all()
        students = [enrollment.student for enrollment in enrollments]
        
        if not students:
            return jsonify({'insights': 'No students enrolled in this class yet.'}), 200
        
        # Aggregate performance data
        total_students = len(students)
        total_quizzes_taken = 0
        total_score = 0
        low_performers = []
        
        for student in students:
            results = QuizResult.query.filter_by(student_id=student.id).all()
            if results:
                avg_score = sum(r.score for r in results) / len(results)
                total_quizzes_taken += len(results)
                total_score += avg_score
                
                if avg_score < 60:  # Students scoring below 60%
                    low_performers.append(student.name)
        
        avg_class_score = total_score / total_students if total_students > 0 else 0
        
        # Generate insights using AI
        prompt = f"""
        Analyze this class performance data and provide educational insights:
        
        Class: {class_obj.name}
        Total Students: {total_students}
        Average Class Score: {avg_class_score:.1f}%
        Total Quizzes Taken: {total_quizzes_taken}
        Students Needing Help: {len(low_performers)}
        
        Provide specific, actionable recommendations for:
        1. Improving overall class performance
        2. Helping struggling students
        3. Engaging high performers
        4. Quiz/content suggestions
        
        Keep the response concise and educational.
        """
        
        try:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            insights = response.text
            
            return jsonify({
                'class_stats': {
                    'total_students': total_students,
                    'average_score': round(avg_class_score, 2),
                    'total_quizzes': total_quizzes_taken,
                    'students_needing_help': len(low_performers)
                },
                'insights': insights
            }), 200
            
        except Exception as ai_error:
            return jsonify({
                'class_stats': {
                    'total_students': total_students,
                    'average_score': round(avg_class_score, 2),
                    'total_quizzes': total_quizzes_taken,
                    'students_needing_help': len(low_performers)
                },
                'insights': 'AI insights temporarily unavailable. Please check your API configuration.'
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/quizzes', methods=['GET'])
@jwt_required()
def get_teacher_quizzes():
    try:
        teacher = require_teacher()
        if not teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        
        quizzes = Quiz.query.filter_by(created_by=teacher.id).all()
        quiz_list = []
        
        for quiz in quizzes:
            quiz_data = quiz.to_dict(include_answers=True)
            # Add result statistics
            results = QuizResult.query.filter_by(quiz_id=quiz.id).all()
            quiz_data['attempts'] = len(results)
            quiz_data['average_score'] = sum(r.score for r in results) / len(results) if results else 0
            quiz_list.append(quiz_data)
        
        return jsonify({'quizzes': quiz_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500