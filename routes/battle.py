from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room, leave_room
from models import db, User, Quiz, Battle, QuizResult
import json
from datetime import datetime

battle_bp = Blueprint('battle', __name__)

def require_student():
    """Ensure user is a student"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'student':
        return None
    return user

@battle_bp.route('/start', methods=['POST'])
@jwt_required()
def start_battle():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        data = request.get_json()
        quiz_id = data.get('quiz_id')
        
        if not quiz_id:
            return jsonify({'error': 'Quiz ID is required'}), 400
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'error': 'Quiz not found'}), 404
        
        if not quiz.is_battle_enabled:
            return jsonify({'error': 'This quiz does not support battles'}), 400
        
        # Check if student has access to this quiz
        if quiz.class_id:
            student_class_ids = [enrollment.class_id for enrollment in student.enrollments]
            if quiz.class_id not in student_class_ids:
                return jsonify({'error': 'Access denied to this quiz'}), 403
        
        # Check if student already completed this quiz
        existing_result = QuizResult.query.filter_by(quiz_id=quiz_id, student_id=student.id).first()
        if existing_result:
            return jsonify({'error': 'You have already completed this quiz'}), 400
        
        # Look for existing waiting battle
        waiting_battle = Battle.query.filter_by(
            quiz_id=quiz_id,
            status='waiting'
        ).first()
        
        if waiting_battle:
            # Join existing battle
            participants = json.loads(waiting_battle.participants)
            if student.id not in participants:
                participants.append(student.id)
                waiting_battle.participants = json.dumps(participants)
                
                # If we have enough participants (2), start the battle
                if len(participants) >= 2:
                    waiting_battle.status = 'active'
                    waiting_battle.started_at = datetime.utcnow()
                
                db.session.commit()
                
                return jsonify({
                    'message': 'Joined battle successfully',
                    'battle': waiting_battle.to_dict()
                }), 200
            else:
                return jsonify({'error': 'You are already in this battle'}), 400
        else:
            # Create new battle
            new_battle = Battle(
                quiz_id=quiz_id,
                participants=json.dumps([student.id]),
                status='waiting'
            )
            
            db.session.add(new_battle)
            db.session.commit()
            
            return jsonify({
                'message': 'Battle created, waiting for opponents',
                'battle': new_battle.to_dict()
            }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@battle_bp.route('/<int:battle_id>/join', methods=['POST'])
@jwt_required()
def join_battle(battle_id):
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        battle = Battle.query.get(battle_id)
        if not battle:
            return jsonify({'error': 'Battle not found'}), 404
        
        if battle.status != 'waiting':
            return jsonify({'error': 'Cannot join battle that is not waiting'}), 400
        
        participants = json.loads(battle.participants)
        
        if student.id in participants:
            return jsonify({'error': 'Already joined this battle'}), 400
        
        if len(participants) >= 4:  # Max 4 participants
            return jsonify({'error': 'Battle is full'}), 400
        
        # Check if student has access to the quiz
        quiz = battle.quiz
        if quiz.class_id:
            student_class_ids = [enrollment.class_id for enrollment in student.enrollments]
            if quiz.class_id not in student_class_ids:
                return jsonify({'error': 'Access denied to this quiz'}), 403
        
        # Check if student already completed this quiz
        existing_result = QuizResult.query.filter_by(quiz_id=quiz.id, student_id=student.id).first()
        if existing_result:
            return jsonify({'error': 'You have already completed this quiz'}), 400
        
        participants.append(student.id)
        battle.participants = json.dumps(participants)
        
        # Start battle if we have enough participants
        if len(participants) >= 2:
            battle.status = 'active'
            battle.started_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Joined battle successfully',
            'battle': battle.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@battle_bp.route('/<int:battle_id>/submit', methods=['POST'])
@jwt_required()
def submit_battle_answers(battle_id):
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        battle = Battle.query.get(battle_id)
        if not battle:
            return jsonify({'error': 'Battle not found'}), 404
        
        if battle.status != 'active':
            return jsonify({'error': 'Battle is not active'}), 400
        
        participants = json.loads(battle.participants)
        if student.id not in participants:
            return jsonify({'error': 'You are not a participant in this battle'}), 403
        
        data = request.get_json()
        answers = data.get('answers', [])
        time_taken = data.get('time_taken', 0)
        
        if not answers:
            return jsonify({'error': 'No answers provided'}), 400
        
        # Calculate score
        quiz = battle.quiz
        questions = json.loads(quiz.questions)
        correct_answers = 0
        total_questions = len(questions)
        
        for i, question in enumerate(questions):
            if i < len(answers) and answers[i] == question['correct_answer']:
                correct_answers += 1
        
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        
        # Update battle scores
        scores = json.loads(battle.scores) if battle.scores else {}
        scores[str(student.id)] = {
            'score': score,
            'time_taken': time_taken,
            'completed_at': datetime.utcnow().isoformat()
        }
        battle.scores = json.dumps(scores)
        
        # Create individual quiz result
        xp_earned = quiz.xp_reward
        
        # Battle bonus XP
        if score >= 90:
            xp_earned += 20  # High score bonus
        if time_taken < quiz.time_limit / 2:  # Completed in less than half the time
            xp_earned += 10  # Speed bonus
        
        result = QuizResult(
            quiz_id=quiz.id,
            student_id=student.id,
            score=score,
            answers=json.dumps(answers),
            xp_earned=xp_earned,
            time_taken=time_taken
        )
        
        db.session.add(result)
        
        # Update student XP
        student.xp += xp_earned
        
        # Check if all participants have submitted
        submitted_count = len(scores)
        total_participants = len(participants)
        
        if submitted_count == total_participants:
            # Battle completed, determine winner
            winner_id = None
            highest_score = -1
            
            for participant_id, participant_data in scores.items():
                if participant_data['score'] > highest_score:
                    highest_score = participant_data['score']
                    winner_id = int(participant_id)
                elif participant_data['score'] == highest_score:
                    # Tie-breaker: faster completion time
                    current_winner_data = scores.get(str(winner_id), {})
                    if participant_data['time_taken'] < current_winner_data.get('time_taken', float('inf')):
                        winner_id = int(participant_id)
            
            battle.winner_id = winner_id
            battle.status = 'completed'
            battle.completed_at = datetime.utcnow()
            
            # Award bonus XP to winner
            if winner_id:
                winner = User.query.get(winner_id)
                if winner:
                    winner.xp += 25  # Winner bonus
        
        db.session.commit()
        
        return jsonify({
            'message': 'Answers submitted successfully',
            'battle': battle.to_dict(),
            'your_score': score,
            'xp_earned': xp_earned,
            'is_completed': battle.status == 'completed'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@battle_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_battles():
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        # Get student's class IDs
        student_class_ids = [enrollment.class_id for enrollment in student.enrollments]
        
        if not student_class_ids:
            return jsonify({'battles': []}), 200
        
        # Get quizzes from student's classes that support battles
        available_quizzes = Quiz.query.filter(
            Quiz.class_id.in_(student_class_ids),
            Quiz.is_battle_enabled == True
        ).all()
        
        # Filter out quizzes already completed by student
        completed_quiz_ids = [r.quiz_id for r in QuizResult.query.filter_by(student_id=student.id).all()]
        available_quizzes = [q for q in available_quizzes if q.id not in completed_quiz_ids]
        
        # Get waiting battles for these quizzes
        quiz_ids = [q.id for q in available_quizzes]
        waiting_battles = Battle.query.filter(
            Battle.quiz_id.in_(quiz_ids),
            Battle.status == 'waiting'
        ).all()
        
        battles_data = []
        for battle in waiting_battles:
            battle_dict = battle.to_dict()
            # Add participant names
            participants = json.loads(battle.participants)
            participant_names = []
            for participant_id in participants:
                participant = User.query.get(participant_id)
                if participant:
                    participant_names.append(participant.name)
            battle_dict['participant_names'] = participant_names
            battles_data.append(battle_dict)
        
        return jsonify({
            'available_battles': battles_data,
            'available_quizzes': [quiz.to_dict() for quiz in available_quizzes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@battle_bp.route('/<int:battle_id>', methods=['GET'])
@jwt_required()
def get_battle(battle_id):
    try:
        student = require_student()
        if not student:
            return jsonify({'error': 'Student access required'}), 403
        
        battle = Battle.query.get(battle_id)
        if not battle:
            return jsonify({'error': 'Battle not found'}), 404
        
        participants = json.loads(battle.participants)
        if student.id not in participants:
            return jsonify({'error': 'You are not a participant in this battle'}), 403
        
        battle_data = battle.to_dict()
        
        # Add participant details
        participant_details = []
        for participant_id in participants:
            participant = User.query.get(participant_id)
            if participant:
                participant_details.append({
                    'id': participant.id,
                    'name': participant.name,
                    'level': participant.level
                })
        
        battle_data['participant_details'] = participant_details
        
        # Add quiz data (without answers for active battles)
        if battle.status == 'active':
            battle_data['quiz'] = battle.quiz.to_dict(include_answers=False)
        else:
            battle_data['quiz'] = battle.quiz.to_dict(include_answers=True)
        
        return jsonify({'battle': battle_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500