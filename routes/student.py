from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Quiz, QuizResult, Badge, Class, Enrollment
import json
import google.generativeai as genai
from datetime import datetime, timedelta

student_bp = Blueprint('student', __name__)

def require_student():
    """Decorator to ensure user is a student"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'student':
        return None
    return user

@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        # Get enrolled classes
        enrolled_classes = student.get_enrolled_classes()
        
        # Get available quizzes
        class_ids = [cls.id for cls in enrolled_classes]
        available_quizzes = Quiz.query.filter(Quiz.class_id.in_(class_ids)).all()
        
        # Get completed quiz IDs
        completed_quiz_ids = [r.quiz_id for r in QuizResult.query.filter_by(student_id=student.id).all()]
        
        # Filter out completed quizzes
        pending_quizzes = [q for q in available_quizzes if q.id not in completed_quiz_ids]
        
        # Get recent quiz results
        recent_results = QuizResult.query.filter_by(student_id=student.id)\
                                       .order_by(QuizResult.completed_at.desc())\
                                       .limit(5).all()
        
        # Get badges
        badges = Badge.query.filter_by(awarded_to=student.id, approved=True).all()
        
        # Calculate streak (simple implementation)
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        
        # Check if student completed any quiz today or yesterday
        today_activity = QuizResult.query.filter_by(student_id=student.id)\
                                        .filter(db.func.date(QuizResult.completed_at) == today)\
                                        .first()
        
        yesterday_activity = QuizResult.query.filter_by(student_id=student.id)\
                                           .filter(db.func.date(QuizResult.completed_at) == yesterday)\
                                           .first()
        
        # Update streak
        if today_activity:
            if not yesterday_activity and student.streak > 0:
                # Streak broken
                student.streak = 1
            elif yesterday_activity or student.streak == 0:
                # Continue or start streak
                student.streak += 1 if yesterday_activity else 1
        elif not yesterday_activity and student.streak > 0:
            # No activity today or yesterday, reset streak
            student.streak = 0
        
        db.session.commit()
        
        dashboard_data = {
            'student': student.to_dict(),
            'level': student.level,
            'enrolled_classes': [cls.to_dict() for cls in enrolled_classes],
            'pending_quizzes': [quiz.to_dict() for quiz in pending_quizzes],
            'recent_results': [result.to_dict() for result in recent_results],
            'badges': [badge.to_dict() for badge in badges],
            'streak': student.streak
        }
        
        return jsonify({'dashboard': dashboard_data}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/quiz/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'error': 'Quiz not found'}), 404
        
        # Check if student has access to this quiz
        if quiz.class_id:
            student_class_ids = [enrollment.class_id for enrollment in student.enrollments]
            if quiz.class_id not in student_class_ids:
                return jsonify({'error': 'Access denied to this quiz'}), 403
        
        # Check if already completed
        existing_result = QuizResult.query.filter_by(quiz_id=quiz_id, student_id=student.id).first()
        if existing_result:
            return jsonify({'error': 'Quiz already completed'}), 400
        
        # Return quiz without answers
        return jsonify({'quiz': quiz.to_dict(include_answers=False)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/quiz/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'error': 'Quiz not found'}), 404
        
        # Check if already completed
        existing_result = QuizResult.query.filter_by(quiz_id=quiz_id, student_id=student.id).first()
        if existing_result:
            return jsonify({'error': 'Quiz already completed'}), 400
        
        data = request.get_json()
        answers = data.get('answers', [])
        time_taken = data.get('time_taken', 0)
        
        if not answers:
            return jsonify({'error': 'No answers provided'}), 400
        
        # Calculate score
        questions = json.loads(quiz.questions)
        correct_answers = 0
        total_questions = len(questions)
        
        for i, question in enumerate(questions):
            if i < len(answers) and answers[i] == question['correct_answer']:
                correct_answers += 1
        
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        
        # Calculate XP earned (base XP + bonus for high scores)
        base_xp = quiz.xp_reward
        bonus_xp = 0
        
        if score >= 90:
            bonus_xp = int(base_xp * 0.5)  # 50% bonus for 90%+
        elif score >= 80:
            bonus_xp = int(base_xp * 0.3)  # 30% bonus for 80%+
        elif score >= 70:
            bonus_xp = int(base_xp * 0.2)  # 20% bonus for 70%+
        
        total_xp = base_xp + bonus_xp
        
        # Create quiz result
        result = QuizResult(
            quiz_id=quiz_id,
            student_id=student.id,
            score=score,
            answers=json.dumps(answers),
            xp_earned=total_xp,
            time_taken=time_taken
        )
        
        db.session.add(result)
        
        # Update student XP
        student.xp += total_xp
        
        db.session.commit()
        
        # Check for auto-generated badges
        try:
            check_and_award_badges(student, score, total_xp)
        except Exception as badge_error:
            print(f"Badge generation error: {badge_error}")
        
        return jsonify({
            'message': 'Quiz submitted successfully',
            'result': {
                'score': score,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'xp_earned': total_xp,
                'new_total_xp': student.xp,
                'new_level': student.level
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def check_and_award_badges(student, score, xp_earned):
    """Check and award automatic badges based on achievements"""
    try:
        badges_to_award = []
        
        # First quiz badge
        quiz_count = QuizResult.query.filter_by(student_id=student.id).count()
        if quiz_count == 1:
            badges_to_award.append({
                'name': 'First Steps',
                'description': 'Completed your first quiz!',
                'criteria': {'type': 'first_quiz'}
            })
        
        # Perfect score badge
        if score == 100:
            badges_to_award.append({
                'name': 'Perfect Score',
                'description': 'Achieved 100% on a quiz!',
                'criteria': {'type': 'perfect_score', 'score': 100}
            })
        
        # High achiever badge
        if score >= 90:
            badges_to_award.append({
                'name': 'High Achiever',
                'description': 'Scored 90% or higher on a quiz!',
                'criteria': {'type': 'high_score', 'score': score}
            })
        
        # XP milestones
        if student.xp >= 1000 and student.xp - xp_earned < 1000:
            badges_to_award.append({
                'name': 'XP Collector',
                'description': 'Earned 1000 total XP!',
                'criteria': {'type': 'xp_milestone', 'xp': 1000}
            })
        
        # Award badges
        for badge_data in badges_to_award:
            # Check if badge already exists
            existing_badge = Badge.query.filter_by(
                awarded_to=student.id,
                name=badge_data['name']
            ).first()
            
            if not existing_badge:
                badge = Badge(
                    name=badge_data['name'],
                    description=badge_data['description'],
                    criteria=json.dumps(badge_data['criteria']),
                    awarded_to=student.id,
                    generated_by='ai',
                    approved=True  # Auto-approve system badges
                )
                db.session.add(badge)
        
        db.session.commit()
        
    except Exception as e:
        print(f"Error in badge generation: {e}")

@student_bp.route('/badges', methods=['GET'])
@jwt_required()
def get_badges():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        badges = Badge.query.filter_by(awarded_to=student.id, approved=True).all()
        
        return jsonify({
            'badges': [badge.to_dict() for badge in badges],
            'total_badges': len(badges)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        # Get all students in the same classes as this student
        student_class_ids = [enrollment.class_id for enrollment in student.enrollments]
        
        if not student_class_ids:
            return jsonify({'leaderboard': []}), 200
        
        # Get all enrollments in those classes
        class_enrollments = Enrollment.query.filter(Enrollment.class_id.in_(student_class_ids)).all()
        classmate_ids = list(set([enrollment.student_id for enrollment in class_enrollments]))
        
        # Get classmates and their stats
        classmates = User.query.filter(User.id.in_(classmate_ids)).all()
        
        leaderboard = []
        for classmate in classmates:
            quiz_results = QuizResult.query.filter_by(student_id=classmate.id).all()
            avg_score = sum(result.score for result in quiz_results) / len(quiz_results) if quiz_results else 0
            
            leaderboard.append({
                'student': {
                    'id': classmate.id,
                    'name': classmate.name,
                    'level': classmate.level
                },
                'total_xp': classmate.xp,
                'average_score': round(avg_score, 2),
                'quiz_count': len(quiz_results),
                'streak': classmate.streak,
                'is_current_user': classmate.id == student.id
            })
        
        # Sort by XP (primary) and average score (secondary)
        leaderboard.sort(key=lambda x: (x['total_xp'], x['average_score']), reverse=True)
        
        # Add rankings
        for i, entry in enumerate(leaderboard):
            entry['rank'] = i + 1
        
        return jsonify({'leaderboard': leaderboard}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/ai-assistant', methods=['POST'])
@jwt_required()
def ai_assistant():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Create context about the student for better responses
        context = f"""
        You are an AI study assistant helping a student named {student.name}.
        Student's current level: {student.level}
        Student's total XP: {student.xp}
        Student's current streak: {student.streak}
        
        Provide helpful, encouraging, and educational responses.
        Keep responses concise but informative.
        """
        
        prompt = f"{context}\n\nStudent question: {question}"
        
        try:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            
            return jsonify({
                'question': question,
                'response': response.text
            }), 200
            
        except Exception as ai_error:
            return jsonify({
                'question': question,
                'response': "I'm sorry, I'm having trouble connecting right now. Please try again later or ask your teacher for help!"
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_progress():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        # Get quiz results
        quiz_results = QuizResult.query.filter_by(student_id=student.id)\
                                     .order_by(QuizResult.completed_at.asc()).all()
        
        # Calculate progress over time
        progress_data = []
        cumulative_xp = 0
        
        for result in quiz_results:
            cumulative_xp += result.xp_earned
            progress_data.append({
                'date': result.completed_at.strftime('%Y-%m-%d'),
                'quiz_title': result.quiz.title,
                'score': result.score,
                'xp_earned': result.xp_earned,
                'cumulative_xp': cumulative_xp
            })
        
        # Get statistics
        total_quizzes = len(quiz_results)
        avg_score = sum(result.score for result in quiz_results) / total_quizzes if total_quizzes > 0 else 0
        
        # Get badges count
        badges_count = Badge.query.filter_by(awarded_to=student.id, approved=True).count()
        
        return jsonify({
            'progress': {
                'student': student.to_dict(),
                'statistics': {
                    'total_quizzes': total_quizzes,
                    'average_score': round(avg_score, 2),
                    'total_xp': student.xp,
                    'current_level': student.level,
                    'current_streak': student.streak,
                    'badges_earned': badges_count
                },
                'progress_over_time': progress_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500