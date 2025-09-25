from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

# Initialize db without app - will be configured in app.py
db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('teacher', 'student', name='user_roles'), nullable=False)
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    classes_taught = db.relationship('Class', backref='teacher', lazy=True)
    enrollments = db.relationship('Enrollment', backref='student', lazy=True)
    quiz_results = db.relationship('QuizResult', backref='student', lazy=True)
    badges_earned = db.relationship('Badge', backref='recipient', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'xp': self.xp,
            'streak': self.streak,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat()
        }
    
    @property
    def level(self):
        """Calculate user level based on XP"""
        return min(self.xp // 100 + 1, 100)  # Level up every 100 XP, max level 100
    
    def get_enrolled_classes(self):
        """Get classes the student is enrolled in"""
        if self.role != 'student':
            return []
        return [enrollment.class_obj for enrollment in self.enrollments]

class Class(db.Model):
    __tablename__ = 'classes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False)  # Unique class code for joining
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    enrollments = db.relationship('Enrollment', backref='class_obj', lazy=True, cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='class_obj', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name,
            'code': self.code,
            'created_at': self.created_at.isoformat(),
            'student_count': len(self.enrollments)
        }
    
    def get_students(self):
        """Get all students enrolled in this class"""
        return [enrollment.student for enrollment in self.enrollments]

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate enrollments
    __table_args__ = (db.UniqueConstraint('class_id', 'student_id', name='unique_enrollment'),)

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    questions = db.Column(db.Text, nullable=False)  # JSON string of questions
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)  # Optional class assignment
    is_battle_enabled = db.Column(db.Boolean, default=False)
    time_limit = db.Column(db.Integer, default=300)  # Time limit in seconds
    xp_reward = db.Column(db.Integer, default=50)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='created_quizzes', lazy=True)
    results = db.relationship('QuizResult', backref='quiz', lazy=True)
    battles = db.relationship('Battle', backref='quiz', lazy=True)
    
    def to_dict(self, include_answers=False):
        questions_data = json.loads(self.questions)
        if not include_answers:
            # Remove correct answers from questions for students
            for question in questions_data:
                if 'correct_answer' in question:
                    del question['correct_answer']
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'questions': questions_data,
            'created_by': self.created_by,
            'creator_name': self.creator.name,
            'class_id': self.class_id,
            'is_battle_enabled': self.is_battle_enabled,
            'time_limit': self.time_limit,
            'xp_reward': self.xp_reward,
            'created_at': self.created_at.isoformat(),
            'question_count': len(questions_data)
        }
    
    def get_questions_with_answers(self):
        """Get questions with correct answers (for teachers)"""
        return json.loads(self.questions)

class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)  # Percentage score (0-100)
    answers = db.Column(db.Text)  # JSON string of student answers
    xp_earned = db.Column(db.Integer, default=0)
    time_taken = db.Column(db.Integer)  # Time taken in seconds
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent multiple attempts (can be removed if retakes are allowed)
    __table_args__ = (db.UniqueConstraint('quiz_id', 'student_id', name='unique_quiz_attempt'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title,
            'student_id': self.student_id,
            'student_name': self.student.name,
            'score': self.score,
            'xp_earned': self.xp_earned,
            'time_taken': self.time_taken,
            'completed_at': self.completed_at.isoformat()
        }

class Battle(db.Model):
    __tablename__ = 'battles'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    participants = db.Column(db.Text, nullable=False)  # JSON array of participant IDs
    scores = db.Column(db.Text)  # JSON object of participant scores
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.Enum('waiting', 'active', 'completed', name='battle_status'), default='waiting')
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    winner = db.relationship('User', backref='battles_won', lazy=True)
    
    def to_dict(self):
        participants_data = json.loads(self.participants) if self.participants else []
        scores_data = json.loads(self.scores) if self.scores else {}
        
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title,
            'participants': participants_data,
            'scores': scores_data,
            'winner_id': self.winner_id,
            'winner_name': self.winner.name if self.winner else None,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat()
        }
    
    def add_participant(self, user_id):
        """Add a participant to the battle"""
        participants = json.loads(self.participants) if self.participants else []
        if user_id not in participants:
            participants.append(user_id)
            self.participants = json.dumps(participants)
    
    def update_score(self, user_id, score):
        """Update a participant's score"""
        scores = json.loads(self.scores) if self.scores else {}
        scores[str(user_id)] = score
        self.scores = json.dumps(scores)

class Badge(db.Model):
    __tablename__ = 'badges'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon_url = db.Column(db.String(255))
    criteria = db.Column(db.Text)  # JSON string describing how to earn this badge
    awarded_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    generated_by = db.Column(db.Enum('teacher', 'ai', name='badge_generator'), default='teacher')
    approved = db.Column(db.Boolean, default=True)  # For AI-generated badges pending approval
    awarded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon_url': self.icon_url,
            'criteria': json.loads(self.criteria) if self.criteria else None,
            'awarded_to': self.awarded_to,
            'recipient_name': self.recipient.name,
            'generated_by': self.generated_by,
            'approved': self.approved,
            'awarded_at': self.awarded_at.isoformat()
        }