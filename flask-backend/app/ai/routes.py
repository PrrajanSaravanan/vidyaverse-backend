from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai
from app.ai import bp
from app.models import User, Badge, db
import json
import re

# Configure Gemini AI
def get_gemini_model():
    if not current_app.config.get('GEMINI_API_KEY'):
        return None
    
    genai.configure(api_key=current_app.config['GEMINI_API_KEY'])
    return genai.GenerativeModel('gemini-pro')

@bp.route('/generate-quiz', methods=['POST'])
@jwt_required()
def generate_quiz():
    """Generate quiz questions using Gemini Pro"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Only teachers can generate quizzes'}), 403
        
        model = get_gemini_model()
        if not model:
            return jsonify({'error': 'AI service not configured'}), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['subject', 'difficulty', 'question_count']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        subject = data['subject']
        difficulty = data['difficulty']
        question_count = min(int(data['question_count']), 20)  # Limit to 20 questions
        topic = data.get('topic', '')
        grade_level = data.get('grade_level', 'High School')
        
        # Create prompt
        prompt = f"""Generate {question_count} {difficulty} level multiple choice questions about {subject}.

Context:
- Target audience: {grade_level} students
- Subject: {subject}
- Difficulty: {difficulty}
- Topic focus: {topic if topic else 'general concepts'}

Requirements:
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Make questions engaging and educational
- Vary question types and complexity within the {difficulty} level
- Ensure questions are age-appropriate for {grade_level}

Difficulty Guidelines:
- Easy: Basic recall, simple concepts, straightforward language
- Medium: Application of knowledge, moderate analysis, some critical thinking
- Hard: Complex problem-solving, synthesis of multiple concepts, advanced analysis

Return the response in this exact JSON format:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Clear explanation of why this answer is correct",
      "points": 10
    }}
  ]
}}"""

        try:
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                raise ValueError("No valid JSON found in AI response")
            
            ai_response = json.loads(json_match.group(0))
            
            # Transform to our format
            questions = []
            for i, q in enumerate(ai_response.get('questions', [])):
                question = {
                    'id': f'ai_q_{i+1}',
                    'question': q.get('question', ''),
                    'options': q.get('options', []),
                    'correct_answer': q.get('correct_answer', 0),
                    'explanation': q.get('explanation', ''),
                    'points': q.get('points', 10),
                    'time_limit': 60 if difficulty == 'easy' else 90 if difficulty == 'medium' else 120
                }
                questions.append(question)
            
            if not questions:
                raise ValueError("No questions generated")
            
            return jsonify({
                'success': True,
                'questions': questions,
                'ai_prompt': prompt[:200] + '...'
            }), 200
            
        except Exception as ai_error:
            current_app.logger.error(f"AI generation error: {str(ai_error)}")
            return jsonify({'error': 'Failed to generate quiz with AI'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Generate quiz error: {str(e)}")
        return jsonify({'error': 'Failed to generate quiz'}), 500

@bp.route('/generate-badge', methods=['POST'])
@jwt_required()
def generate_badge():
    """Generate badge suggestion using Gemini Pro"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Only teachers can generate badges'}), 403
        
        model = get_gemini_model()
        if not model:
            return jsonify({'error': 'AI service not configured'}), 503
        
        data = request.get_json()
        
        achievement = data.get('achievement', '')
        category = data.get('category', 'achievement')
        subject = data.get('subject', 'General')
        context = data.get('context', '')
        
        prompt = f"""Create a gamification badge for the following achievement: "{achievement}"

Context:
- Category: {category}
- Subject area: {subject}
- Additional context: {context}

Badge categories and their characteristics:
- achievement: Performance milestones, mastery demonstrations
- streak: Consistency rewards, habit formation
- subject: Subject-specific expertise, topic mastery
- social: Collaboration, helping others, peer interaction
- special: Unique accomplishments, creativity, going above and beyond

Create a badge that is:
- Motivating and inspiring
- Clear in its requirements
- Achievable but challenging
- Relevant to learning goals
- Appealing to students

Return the response in this exact JSON format:
{{
  "name": "Badge Name (2-4 words, memorable)",
  "description": "Clear description of what this badge represents (1-2 sentences)",
  "criteria": "Specific criteria for earning this badge",
  "rarity": "common/rare/epic/legendary",
  "xp_value": 50,
  "motivational_message": "Congratulatory message when earned",
  "icon_suggestion": "Description of visual design for the badge icon"
}}

Rarity guidelines:
- common: Basic achievements, easy to earn (10-25 XP)
- rare: Solid accomplishments, moderate effort (25-75 XP)
- epic: Significant achievements, substantial effort (75-150 XP)
- legendary: Exceptional accomplishments, rare feats (150+ XP)"""

        try:
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                raise ValueError("No valid JSON found in AI response")
            
            badge_data = json.loads(json_match.group(0))
            
            # Validate and transform response
            badge_suggestion = {
                'name': badge_data.get('name', 'Custom Badge'),
                'description': badge_data.get('description', ''),
                'category': category,
                'rarity': badge_data.get('rarity', 'common'),
                'xp_value': badge_data.get('xp_value', 50),
                'criteria_description': badge_data.get('criteria', ''),
                'motivational_message': badge_data.get('motivational_message', ''),
                'icon_suggestion': badge_data.get('icon_suggestion', ''),
                'generated_by_ai': True,
                'ai_prompt': prompt[:200] + '...'
            }
            
            return jsonify({
                'success': True,
                'badge': badge_suggestion
            }), 200
            
        except Exception as ai_error:
            current_app.logger.error(f"AI badge generation error: {str(ai_error)}")
            return jsonify({'error': 'Failed to generate badge with AI'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Generate badge error: {str(e)}")
        return jsonify({'error': 'Failed to generate badge'}), 500

@bp.route('/class-insights', methods=['POST'])
@jwt_required()
def get_class_insights():
    """Generate class insights using Gemini Pro"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Only teachers can get class insights'}), 403
        
        model = get_gemini_model()
        if not model:
            return jsonify({'error': 'AI service not configured'}), 503
        
        data = request.get_json()
        
        class_data = {
            'class_name': data.get('class_name', 'Unknown Class'),
            'student_count': data.get('student_count', 0),
            'avg_score': data.get('avg_score', 0),
            'completion_rate': data.get('completion_rate', 0),
            'top_subjects': data.get('top_subjects', []),
            'weak_subjects': data.get('weak_subjects', []),
            'streak_data': data.get('streak_data', []),
            'recent_quizzes': data.get('recent_quizzes', [])
        }
        
        prompt = f"""Analyze this class performance data and provide educational insights:

Class Profile:
- Class name: {class_data['class_name']}
- Number of students: {class_data['student_count']}
- Average score: {class_data['avg_score']}%
- Completion rate: {class_data['completion_rate']}%
- Strong subjects: {', '.join(class_data['top_subjects'])}
- Weak subjects: {', '.join(class_data['weak_subjects'])}

Recent activity summary:
- Active students with streaks: {len([s for s in class_data['streak_data'] if s.get('current_streak', 0) > 0])}
- Recent quizzes completed: {len(class_data['recent_quizzes'])}

Provide insights in this JSON format:
{{
  "overall_performance": "Brief assessment of class performance and trends",
  "strengths": ["List of class strengths"],
  "areas_for_improvement": ["List of areas needing attention"],
  "recommendations": [
    {{
      "action": "Specific action to take",
      "reason": "Why this action would help",
      "priority": "high/medium/low"
    }}
  ],
  "motivational_message": "Encouraging message for the teacher",
  "suggested_quiz_topics": ["Topic suggestions for struggling areas"]
}}

Focus on:
- Actionable insights for the teacher
- Student engagement strategies
- Personalized learning approaches
- Gamification opportunities"""

        try:
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                raise ValueError("No valid JSON found in AI response")
            
            insights = json.loads(json_match.group(0))
            
            return jsonify({
                'success': True,
                'insights': insights
            }), 200
            
        except Exception as ai_error:
            current_app.logger.error(f"AI insights error: {str(ai_error)}")
            return jsonify({'error': 'Failed to generate insights with AI'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Class insights error: {str(e)}")
        return jsonify({'error': 'Failed to generate class insights'}), 500

@bp.route('/study-recommendations', methods=['POST'])
@jwt_required()
def get_study_recommendations():
    """Generate personalized study recommendations using Gemini Pro"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        model = get_gemini_model()
        if not model:
            return jsonify({'error': 'AI service not configured'}), 503
        
        data = request.get_json()
        
        # Use current user data if no specific student provided
        student_data = {
            'student_name': data.get('student_name', user.display_name),
            'current_level': data.get('current_level', user.level if user.role == 'student' else 1),
            'xp': data.get('xp', user.xp if user.role == 'student' else 0),
            'weak_subjects': data.get('weak_subjects', []),
            'strong_subjects': data.get('strong_subjects', []),
            'recent_scores': data.get('recent_scores', []),
            'streak_data': {
                'current_streak': data.get('current_streak', user.current_streak if user.role == 'student' else 0),
                'longest_streak': data.get('longest_streak', user.longest_streak if user.role == 'student' else 0)
            },
            'badges': data.get('badges', len(user.earned_badges) if user.role == 'student' else 0)
        }
        
        avg_score = sum(student_data['recent_scores']) / len(student_data['recent_scores']) if student_data['recent_scores'] else 0
        
        prompt = f"""Create personalized study recommendations for this student:

Student Profile:
- Name: {student_data['student_name']}
- Level: {student_data['current_level']} ({student_data['xp']} XP)
- Average Recent Score: {avg_score:.1f}%
- Current Streak: {student_data['streak_data']['current_streak']} days
- Strong Subjects: {', '.join(student_data['strong_subjects'])}
- Areas for Improvement: {', '.join(student_data['weak_subjects'])}
- Badges Earned: {student_data['badges']}

Generate recommendations in this JSON format:
{{
  "personalized_message": "Encouraging personal message addressing their progress",
  "study_plan": {{
    "focus_areas": ["List of 2-3 specific topics to focus on"],
    "daily_goals": ["Achievable daily learning goals"],
    "weekly_targets": ["Weekly milestone targets"]
  }},
  "motivational_tips": ["Study tips and motivation strategies"],
  "next_badge_opportunities": [
    {{
      "badge_name": "Suggested badge name",
      "description": "What they need to do to earn it",
      "difficulty": "easy/medium/hard"
    }}
  ],
  "practice_suggestions": [
    {{
      "subject": "Subject area",
      "activity": "Specific practice activity",
      "reason": "Why this would help"
    }}
  ]
}}

Make recommendations:
- Specific and actionable
- Appropriate for their current level
- Encouraging and motivating
- Focused on improvement areas while building on strengths"""

        try:
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                raise ValueError("No valid JSON found in AI response")
            
            recommendations = json.loads(json_match.group(0))
            
            return jsonify({
                'success': True,
                'recommendations': recommendations
            }), 200
            
        except Exception as ai_error:
            current_app.logger.error(f"AI recommendations error: {str(ai_error)}")
            return jsonify({'error': 'Failed to generate recommendations with AI'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Study recommendations error: {str(e)}")
        return jsonify({'error': 'Failed to generate study recommendations'}), 500

@bp.route('/explain-concept', methods=['POST'])
@jwt_required()
def explain_concept():
    """Explain a concept using Gemini Pro"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        model = get_gemini_model()
        if not model:
            return jsonify({'error': 'AI service not configured'}), 503
        
        data = request.get_json()
        
        concept = data.get('concept', '')
        subject = data.get('subject', 'General')
        difficulty = data.get('difficulty', 'medium')
        
        if not concept:
            return jsonify({'error': 'Concept to explain is required'}), 400
        
        prompt = f"""Explain the concept "{concept}" in {subject} for a {difficulty} level understanding.

Provide a clear, engaging explanation that:
- Uses simple language appropriate for the level
- Includes relevant examples
- Breaks down complex ideas into steps
- Connects to real-world applications when possible
- Encourages further learning

Format your response as helpful, educational content that a student would find easy to understand and remember."""

        try:
            response = model.generate_content(prompt)
            explanation = response.text
            
            return jsonify({
                'success': True,
                'explanation': explanation,
                'concept': concept,
                'subject': subject
            }), 200
            
        except Exception as ai_error:
            current_app.logger.error(f"AI explanation error: {str(ai_error)}")
            return jsonify({'error': 'Failed to generate explanation with AI'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Explain concept error: {str(e)}")
        return jsonify({'error': 'Failed to explain concept'}), 500