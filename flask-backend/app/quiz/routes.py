from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.quiz import bp
from app.models import User, Quiz, QuizAttempt, Class, db
from app.gamification.service import GamificationService
from datetime import datetime
import json

@bp.route('/create', methods=['POST'])
@jwt_required()
def create_quiz():
    """Create a new quiz (teachers only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Only teachers can create quizzes'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'subject', 'questions']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate questions format
        questions = data['questions']
        if not isinstance(questions, list) or len(questions) == 0:
            return jsonify({'error': 'At least one question is required'}), 400
        
        for i, question in enumerate(questions):
            if not all(key in question for key in ['question', 'options', 'correct_answer']):
                return jsonify({'error': f'Question {i+1} is missing required fields'}), 400
        
        # Create quiz
        quiz = Quiz(
            title=data['title'],
            description=data.get('description', ''),
            subject=data['subject'],
            difficulty=data.get('difficulty', 'medium'),
            questions=questions,
            time_limit=data.get('time_limit'),
            class_id=data.get('class_id'),
            assigned_students=data.get('assigned_students'),
            available_from=datetime.fromisoformat(data['available_from']) if data.get('available_from') else None,
            available_until=datetime.fromisoformat(data['available_until']) if data.get('available_until') else None,
            xp_reward=data.get('xp_reward', 10),
            perfect_score_bonus=data.get('perfect_score_bonus', 5),
            allow_retakes=data.get('allow_retakes', True),
            show_correct_answers=data.get('show_correct_answers', True),
            shuffle_questions=data.get('shuffle_questions', False),
            generated_by_ai=data.get('generated_by_ai', False),
            ai_prompt=data.get('ai_prompt'),
            creator_id=current_user_id
        )
        
        db.session.add(quiz)
        
        # Update class statistics if assigned to a class
        if quiz.class_id:
            class_obj = Class.query.get(quiz.class_id)
            if class_obj and class_obj.teacher_id == current_user_id:
                class_obj.total_quizzes += 1
            else:
                return jsonify({'error': 'Invalid class or insufficient permissions'}), 403
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz created successfully',
            'quiz': quiz.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Quiz creation error: {str(e)}")
        return jsonify({'error': 'Failed to create quiz'}), 500

@bp.route('/list', methods=['GET'])
@jwt_required()
def list_quizzes():
    """Get list of quizzes for current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role == 'teacher':
            # Teachers see quizzes they created
            quizzes = Quiz.query.filter_by(creator_id=current_user_id).all()
        else:
            # Students see quizzes assigned to them
            # Get quizzes from enrolled classes
            class_ids = [c.id for c in user.enrolled_classes]
            quizzes = Quiz.query.filter(
                (Quiz.class_id.in_(class_ids)) | 
                (Quiz.assigned_students.contains([current_user_id]))
            ).filter(Quiz.is_active == True).all()
        
        # Filter available quizzes for students
        if user.role == 'student':
            quizzes = [q for q in quizzes if q.is_available()]
        
        return jsonify({
            'quizzes': [quiz.to_dict() for quiz in quizzes]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Quiz list error: {str(e)}")
        return jsonify({'error': 'Failed to get quizzes'}), 500

@bp.route('/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    """Get quiz details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        quiz = Quiz.query.get(quiz_id)
        
        if not quiz:
            return jsonify({'error': 'Quiz not found'}), 404
        
        # Check permissions
        if user.role == 'teacher':
            if quiz.creator_id != current_user_id:
                return jsonify({'error': 'Access denied'}), 403
        else:
            # Check if student has access to this quiz
            has_access = False
            if quiz.class_id and quiz.assigned_class in user.enrolled_classes:
                has_access = True
            elif quiz.assigned_students and current_user_id in quiz.assigned_students:
                has_access = True
            
            if not has_access or not quiz.is_available():
                return jsonify({'error': 'Quiz not accessible'}), 403
        
        # Include questions for teachers or if student is taking the quiz
        include_questions = user.role == 'teacher' or request.args.get('taking') == 'true'
        
        return jsonify({
            'quiz': quiz.to_dict(include_questions=include_questions)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get quiz error: {str(e)}")
        return jsonify({'error': 'Failed to get quiz'}), 500

@bp.route('/<int:quiz_id>/attempt', methods=['POST'])
@jwt_required()
def submit_quiz_attempt():
    """Submit quiz attempt"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        quiz_id = request.view_args['quiz_id']
        quiz = Quiz.query.get(quiz_id)
        
        if not user or user.role != 'student':
            return jsonify({'error': 'Only students can take quizzes'}), 403
        
        if not quiz or not quiz.is_available():
            return jsonify({'error': 'Quiz not found or not available'}), 404
        
        # Check if student has access
        has_access = False
        if quiz.class_id and quiz.assigned_class in user.enrolled_classes:
            has_access = True
        elif quiz.assigned_students and current_user_id in quiz.assigned_students:
            has_access = True
        
        if not has_access:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if retakes are allowed
        existing_attempt = QuizAttempt.query.filter_by(
            quiz_id=quiz_id, student_id=current_user_id
        ).first()
        
        if existing_attempt and not quiz.allow_retakes:
            return jsonify({'error': 'Retakes not allowed for this quiz'}), 400
        
        data = request.get_json()
        answers = data.get('answers', {})
        time_spent = data.get('time_spent', 0)
        
        # Calculate score
        correct_answers = 0
        total_questions = len(quiz.questions)
        
        for i, question in enumerate(quiz.questions):
            question_id = question.get('id', str(i))
            student_answer = answers.get(question_id)
            correct_answer = question['correct_answer']
            
            if student_answer == correct_answer:
                correct_answers += 1
        
        score_percentage = (correct_answers / total_questions) * 100
        xp_earned = quiz.calculate_xp_reward(score_percentage)
        
        # Create quiz attempt
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=current_user_id,
            answers=answers,
            score=score_percentage,
            correct_answers=correct_answers,
            total_questions=total_questions,
            xp_earned=xp_earned,
            time_spent=time_spent
        )
        
        db.session.add(attempt)
        
        # Update user statistics and gamification
        gamification_service = GamificationService()
        level_up = gamification_service.award_xp(user, xp_earned)
        gamification_service.update_streak(user)
        new_badges = gamification_service.check_badge_eligibility(user)
        
        # Update quiz statistics
        quiz.total_attempts += 1
        
        # Recalculate average score
        all_attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id).all()
        if all_attempts:
            quiz.average_score = sum(a.score for a in all_attempts) / len(all_attempts)
        
        # Update user quiz count
        user.total_quizzes_completed += 1
        
        # Update average score
        user_attempts = QuizAttempt.query.filter_by(student_id=current_user_id).all()
        if user_attempts:
            user.average_score = sum(a.score for a in user_attempts) / len(user_attempts)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz completed successfully',
            'attempt': attempt.to_dict(),
            'level_up': level_up,
            'new_badges': [badge.to_dict() for badge in new_badges]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Quiz attempt error: {str(e)}")
        return jsonify({'error': 'Failed to submit quiz attempt'}), 500

@bp.route('/<int:quiz_id>/results', methods=['GET'])
@jwt_required()
def get_quiz_results(quiz_id):
    """Get quiz results (teachers) or user's attempts (students)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        quiz = Quiz.query.get(quiz_id)
        
        if not quiz:
            return jsonify({'error': 'Quiz not found'}), 404
        
        if user.role == 'teacher':
            # Teachers see all results for their quizzes
            if quiz.creator_id != current_user_id:
                return jsonify({'error': 'Access denied'}), 403
            
            attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id).all()
            results = []
            
            for attempt in attempts:
                result = attempt.to_dict()
                result['student_name'] = attempt.student.display_name
                results.append(result)
            
            return jsonify({
                'quiz': quiz.to_dict(),
                'results': results
            }), 200
            
        else:
            # Students see their own attempts
            attempts = QuizAttempt.query.filter_by(
                quiz_id=quiz_id, student_id=current_user_id
            ).all()
            
            return jsonify({
                'quiz': quiz.to_dict(),
                'attempts': [attempt.to_dict() for attempt in attempts]
            }), 200
        
    except Exception as e:
        current_app.logger.error(f"Quiz results error: {str(e)}")
        return jsonify({'error': 'Failed to get quiz results'}), 500

@bp.route('/<int:quiz_id>', methods=['PUT'])
@jwt_required()
def update_quiz(quiz_id):
    """Update quiz (teachers only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        quiz = Quiz.query.get(quiz_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Only teachers can update quizzes'}), 403
        
        if not quiz or quiz.creator_id != current_user_id:
            return jsonify({'error': 'Quiz not found or access denied'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = [
            'title', 'description', 'questions', 'time_limit', 'xp_reward',
            'perfect_score_bonus', 'allow_retakes', 'show_correct_answers',
            'shuffle_questions', 'available_from', 'available_until', 'is_active'
        ]
        
        for field in allowed_fields:
            if field in data:
                if field in ['available_from', 'available_until'] and data[field]:
                    setattr(quiz, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(quiz, field, data[field])
        
        quiz.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz updated successfully',
            'quiz': quiz.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Quiz update error: {str(e)}")
        return jsonify({'error': 'Failed to update quiz'}), 500

@bp.route('/<int:quiz_id>', methods=['DELETE'])
@jwt_required()
def delete_quiz(quiz_id):
    """Delete quiz (teachers only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        quiz = Quiz.query.get(quiz_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Only teachers can delete quizzes'}), 403
        
        if not quiz or quiz.creator_id != current_user_id:
            return jsonify({'error': 'Quiz not found or access denied'}), 404
        
        # Check if quiz has attempts
        attempts_count = QuizAttempt.query.filter_by(quiz_id=quiz_id).count()
        
        if attempts_count > 0:
            # Soft delete - just mark as inactive
            quiz.is_active = False
            db.session.commit()
            return jsonify({'message': 'Quiz deactivated (has existing attempts)'}), 200
        else:
            # Hard delete - no attempts exist
            db.session.delete(quiz)
            db.session.commit()
            return jsonify({'message': 'Quiz deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Quiz deletion error: {str(e)}")
        return jsonify({'error': 'Failed to delete quiz'}), 500