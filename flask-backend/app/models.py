from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from app import db
import json

# Association tables for many-to-many relationships
class_students = db.Table('class_students',
    db.Column('class_id', db.Integer, db.ForeignKey('classes.id'), primary_key=True),
    db.Column('student_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

user_badges = db.Table('user_badges',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('badge_id', db.Integer, db.ForeignKey('badges.id'), primary_key=True),
    db.Column('earned_at', db.DateTime, default=datetime.utcnow)
)

battle_participants = db.Table('battle_participants',
    db.Column('battle_id', db.Integer, db.ForeignKey('battles.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('joined_at', db.DateTime, default=datetime.utcnow),
    db.Column('score', db.Integer, default=0),
    db.Column('rank', db.Integer)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('student', 'teacher', 'admin', name='user_roles'), 
                     nullable=False, default='student')
    
    # Profile information
    profile_image_url = db.Column(db.String(255))
    bio = db.Column(db.Text)
    
    # Student-specific fields
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    
    # Statistics
    total_quizzes_completed = db.Column(db.Integer, default=0)
    total_battles_won = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)
    
    # Preferences
    notifications_enabled = db.Column(db.Boolean, default=True)
    sound_effects_enabled = db.Column(db.Boolean, default=True)
    theme = db.Column(db.Enum('light', 'dark', name='theme_types'), default='light')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)
    
    # Email verification
    email_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(255))
    
    # Password reset
    password_reset_token = db.Column(db.String(255))
    password_reset_expires = db.Column(db.DateTime)
    
    # Relationships
    created_classes = db.relationship('Class', backref='teacher', lazy='dynamic',
                                    foreign_keys='Class.teacher_id')
    enrolled_classes = db.relationship('Class', secondary=class_students, 
                                     back_populates='students')
    created_quizzes = db.relationship('Quiz', backref='creator', lazy='dynamic')
    quiz_attempts = db.relationship('QuizAttempt', backref='student', lazy='dynamic')
    earned_badges = db.relationship('Badge', secondary=user_badges, 
                                   back_populates='earned_by')
    battles = db.relationship('Battle', secondary=battle_participants, 
                            back_populates='participants')
    streaks = db.relationship('Streak', backref='user', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def calculate_level(self):
        """Calculate level based on XP (100 XP per level)"""
        return (self.xp // 100) + 1
    
    def xp_for_next_level(self):
        """Calculate XP needed for next level"""
        current_level_xp = (self.level - 1) * 100
        next_level_xp = self.level * 100
        return next_level_xp - self.xp
    
    def add_xp(self, amount):
        """Add XP and update level"""
        old_level = self.level
        self.xp += amount
        new_level = self.calculate_level()
        
        if new_level > old_level:
            self.level = new_level
            return True  # Level up occurred
        return False
    
    def update_streak(self):
        """Update daily streak"""
        today = datetime.utcnow().date()
        last_streak = self.streaks.order_by(Streak.date.desc()).first()
        
        if last_streak and last_streak.date == today:
            return  # Already updated today
        
        if last_streak and (today - last_streak.date).days == 1:
            # Continue streak
            self.current_streak += 1
        elif not last_streak or (today - last_streak.date).days > 1:
            # Start new streak or reset
            self.current_streak = 1
        
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        
        # Create streak record
        streak = Streak(user_id=self.id, date=today, 
                       streak_count=self.current_streak)
        db.session.add(streak)
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'email': self.email if include_sensitive else None,
            'username': self.username,
            'display_name': self.display_name,
            'role': self.role,
            'profile_image_url': self.profile_image_url,
            'bio': self.bio,
            'xp': self.xp if self.role == 'student' else None,
            'level': self.level if self.role == 'student' else None,
            'current_streak': self.current_streak if self.role == 'student' else None,
            'longest_streak': self.longest_streak if self.role == 'student' else None,
            'total_quizzes_completed': self.total_quizzes_completed,
            'total_battles_won': self.total_battles_won,
            'average_score': self.average_score,
            'created_at': self.created_at.isoformat(),
            'last_active_at': self.last_active_at.isoformat() if self.last_active_at else None,
        }
        return {k: v for k, v in data.items() if v is not None}

class Class(db.Model):
    __tablename__ = 'classes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    subject = db.Column(db.String(50), nullable=False)
    grade_level = db.Column(db.String(20))
    class_code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    
    # Settings
    is_active = db.Column(db.Boolean, default=True)
    allow_self_enrollment = db.Column(db.Boolean, default=True)
    
    # Statistics
    total_quizzes = db.Column(db.Integer, default=0)
    average_class_score = db.Column(db.Float, default=0.0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    students = db.relationship('User', secondary=class_students, 
                             back_populates='enrolled_classes')
    quizzes = db.relationship('Quiz', backref='assigned_class', lazy='dynamic')
    
    def generate_class_code(self):
        """Generate unique class code"""
        import random
        import string
        
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Class.query.filter_by(class_code=code).first():
                self.class_code = code
                break
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'subject': self.subject,
            'grade_level': self.grade_level,
            'class_code': self.class_code,
            'is_active': self.is_active,
            'total_quizzes': self.total_quizzes,
            'average_class_score': self.average_class_score,
            'student_count': len(self.students),
            'teacher': self.teacher.display_name,
            'created_at': self.created_at.isoformat(),
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    subject = db.Column(db.String(50), nullable=False)
    difficulty = db.Column(db.Enum('easy', 'medium', 'hard', name='difficulty_levels'), 
                          default='medium')
    
    # Content
    questions = db.Column(db.JSON, nullable=False)  # Stored as JSON
    time_limit = db.Column(db.Integer)  # in seconds
    
    # Assignment
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    assigned_students = db.Column(db.JSON)  # List of student IDs for individual assignment
    
    # Scheduling
    available_from = db.Column(db.DateTime)
    available_until = db.Column(db.DateTime)
    
    # Gamification
    xp_reward = db.Column(db.Integer, default=10)
    perfect_score_bonus = db.Column(db.Integer, default=5)
    
    # Settings
    allow_retakes = db.Column(db.Boolean, default=True)
    show_correct_answers = db.Column(db.Boolean, default=True)
    shuffle_questions = db.Column(db.Boolean, default=False)
    
    # AI Generation
    generated_by_ai = db.Column(db.Boolean, default=False)
    ai_prompt = db.Column(db.Text)
    
    # Statistics
    total_attempts = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)
    completion_rate = db.Column(db.Float, default=0.0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy='dynamic', 
                              cascade='all, delete-orphan')
    
    def is_available(self):
        """Check if quiz is currently available"""
        now = datetime.utcnow()
        if self.available_from and now < self.available_from:
            return False
        if self.available_until and now > self.available_until:
            return False
        return self.is_active
    
    def calculate_xp_reward(self, score_percentage):
        """Calculate XP reward based on score"""
        base_xp = int(self.xp_reward * (score_percentage / 100))
        if score_percentage == 100:
            base_xp += self.perfect_score_bonus
        return base_xp
    
    def to_dict(self, include_questions=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'subject': self.subject,
            'difficulty': self.difficulty,
            'time_limit': self.time_limit,
            'xp_reward': self.xp_reward,
            'perfect_score_bonus': self.perfect_score_bonus,
            'allow_retakes': self.allow_retakes,
            'show_correct_answers': self.show_correct_answers,
            'shuffle_questions': self.shuffle_questions,
            'generated_by_ai': self.generated_by_ai,
            'total_attempts': self.total_attempts,
            'average_score': self.average_score,
            'completion_rate': self.completion_rate,
            'is_active': self.is_active,
            'available_from': self.available_from.isoformat() if self.available_from else None,
            'available_until': self.available_until.isoformat() if self.available_until else None,
            'created_at': self.created_at.isoformat(),
            'creator': self.creator.display_name,
            'question_count': len(self.questions) if self.questions else 0,
        }
        
        if include_questions:
            data['questions'] = self.questions
            
        return data

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Responses and scoring
    answers = db.Column(db.JSON, nullable=False)  # Student's answers
    score = db.Column(db.Float, nullable=False)  # Percentage score
    correct_answers = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    
    # XP and rewards
    xp_earned = db.Column(db.Integer, default=0)
    badges_earned = db.Column(db.JSON)  # List of badge IDs earned
    
    # Timing
    time_spent = db.Column(db.Integer)  # in seconds
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title,
            'score': self.score,
            'correct_answers': self.correct_answers,
            'total_questions': self.total_questions,
            'xp_earned': self.xp_earned,
            'time_spent': self.time_spent,
            'completed_at': self.completed_at.isoformat(),
        }

class Badge(db.Model):
    __tablename__ = 'badges'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon_url = db.Column(db.String(255))
    category = db.Column(db.Enum('achievement', 'streak', 'subject', 'social', 'special', 
                                name='badge_categories'), nullable=False)
    
    # Rarity and value
    rarity = db.Column(db.Enum('common', 'rare', 'epic', 'legendary', name='badge_rarity'), 
                      default='common')
    xp_value = db.Column(db.Integer, default=50)
    
    # Earning criteria
    criteria_type = db.Column(db.String(50), nullable=False)  # e.g., 'xp_threshold', 'streak_days'
    criteria_value = db.Column(db.Integer)
    criteria_subject = db.Column(db.String(50))
    criteria_description = db.Column(db.Text)
    
    # Creation and availability
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    generated_by_ai = db.Column(db.Boolean, default=False)
    ai_prompt = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=True)
    
    # Class-specific badges
    class_ids = db.Column(db.JSON)  # List of class IDs if not public
    
    # Statistics
    times_earned = db.Column(db.Integer, default=0)
    first_earned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    first_earned_by = db.relationship('User', foreign_keys=[first_earned_by_id])
    earned_by = db.relationship('User', secondary=user_badges, back_populates='earned_badges')
    
    def check_criteria(self, user):
        """Check if user meets badge criteria"""
        if self.criteria_type == 'xp_threshold':
            return user.xp >= self.criteria_value
        elif self.criteria_type == 'streak_days':
            return user.current_streak >= self.criteria_value
        elif self.criteria_type == 'quiz_completion':
            return user.total_quizzes_completed >= self.criteria_value
        elif self.criteria_type == 'battle_wins':
            return user.total_battles_won >= self.criteria_value
        elif self.criteria_type == 'level_threshold':
            return user.level >= self.criteria_value
        elif self.criteria_type == 'perfect_scores':
            perfect_scores = QuizAttempt.query.filter_by(
                student_id=user.id, score=100.0
            ).count()
            return perfect_scores >= self.criteria_value
        return False
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon_url': self.icon_url,
            'category': self.category,
            'rarity': self.rarity,
            'xp_value': self.xp_value,
            'criteria_description': self.criteria_description,
            'times_earned': self.times_earned,
            'created_at': self.created_at.isoformat(),
        }

class Battle(db.Model):
    __tablename__ = 'battles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    battle_type = db.Column(db.Enum('peer_vs_peer', 'class_tournament', 'practice', 
                                   name='battle_types'), default='peer_vs_peer')
    status = db.Column(db.Enum('waiting', 'active', 'completed', 'cancelled', 
                              name='battle_status'), default='waiting')
    
    # Configuration
    max_participants = db.Column(db.Integer, default=2)
    time_per_question = db.Column(db.Integer, default=30)  # seconds
    total_questions = db.Column(db.Integer, default=5)
    subject = db.Column(db.String(50))
    difficulty = db.Column(db.Enum('easy', 'medium', 'hard', name='difficulty_levels'))
    
    # Content
    questions = db.Column(db.JSON, nullable=False)
    current_question_index = db.Column(db.Integer, default=0)
    
    # Results
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    leaderboard = db.Column(db.JSON)  # Final rankings
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    participants = db.relationship('User', secondary=battle_participants, 
                                 back_populates='battles')
    creator = db.relationship('User', foreign_keys=[creator_id])
    winner = db.relationship('User', foreign_keys=[winner_id])
    
    def can_join(self, user):
        """Check if user can join this battle"""
        if self.status != 'waiting':
            return False
        if len(self.participants) >= self.max_participants:
            return False
        if user in self.participants:
            return False
        return True
    
    def start_battle(self):
        """Start the battle"""
        self.status = 'active'
        self.started_at = datetime.utcnow()
    
    def complete_battle(self):
        """Complete the battle and calculate results"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        # TODO: Calculate final leaderboard and determine winner
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'battle_type': self.battle_type,
            'status': self.status,
            'max_participants': self.max_participants,
            'current_participants': len(self.participants),
            'time_per_question': self.time_per_question,
            'total_questions': self.total_questions,
            'subject': self.subject,
            'difficulty': self.difficulty,
            'current_question_index': self.current_question_index,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'creator': self.creator.display_name,
        }

class Streak(db.Model):
    __tablename__ = 'streaks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    streak_count = db.Column(db.Integer, nullable=False)
    activities_completed = db.Column(db.Integer, default=0)
    xp_earned = db.Column(db.Integer, default=0)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'date'),)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    
    # Data and actions
    data = db.Column(db.JSON)  # Additional data (quiz_id, badge_id, etc.)
    action_url = db.Column(db.String(255))  # Deep link
    
    # Status
    is_read = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.notification_type,
            'data': self.data,
            'action_url': self.action_url,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None,
        }

class Leaderboard(db.Model):
    __tablename__ = 'leaderboards'
    
    id = db.Column(db.Integer, primary_key=True)
    leaderboard_type = db.Column(db.Enum('global', 'class', 'school', name='leaderboard_types'))
    scope_id = db.Column(db.String(50))  # class_id for class leaderboards
    period = db.Column(db.Enum('all_time', 'monthly', 'weekly', 'daily', name='leaderboard_periods'))
    
    # Data
    rankings = db.Column(db.JSON, nullable=False)
    total_participants = db.Column(db.Integer, default=0)
    
    # Timestamps
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.leaderboard_type,
            'scope_id': self.scope_id,
            'period': self.period,
            'rankings': self.rankings,
            'total_participants': self.total_participants,
            'last_updated': self.last_updated.isoformat(),
        }