from app.models import User, Badge, Streak, Notification, Leaderboard, db
from datetime import datetime, date
from sqlalchemy import func

class GamificationService:
    """Service for handling gamification logic"""
    
    def award_xp(self, user, amount):
        """Award XP to user and check for level up"""
        old_level = user.level
        level_up = user.add_xp(amount)
        
        if level_up:
            # Award level up bonus
            bonus_xp = user.level * 10
            user.add_xp(bonus_xp)
            
            # Create level up notification
            self.create_notification(
                user.id,
                'level_up',
                'Level Up!',
                f'Congratulations! You\'ve reached level {user.level}!',
                {'level': user.level, 'bonus_xp': bonus_xp}
            )
            
            # Check for level-based badges
            self.check_level_badges(user)
        
        return level_up
    
    def update_streak(self, user):
        """Update user's daily streak"""
        today = date.today()
        yesterday = date.fromordinal(today.toordinal() - 1)
        
        # Check if user already has activity today
        today_streak = Streak.query.filter_by(
            user_id=user.id, date=today
        ).first()
        
        if today_streak:
            return  # Already updated today
        
        # Get yesterday's streak
        yesterday_streak = Streak.query.filter_by(
            user_id=user.id, date=yesterday
        ).first()
        
        if yesterday_streak:
            # Continue streak
            user.current_streak += 1
        else:
            # Check if there was any recent activity
            last_streak = Streak.query.filter_by(user_id=user.id)\
                .order_by(Streak.date.desc()).first()
            
            if last_streak and (today - last_streak.date).days == 1:
                user.current_streak += 1
            else:
                user.current_streak = 1
        
        # Update longest streak
        if user.current_streak > user.longest_streak:
            user.longest_streak = user.current_streak
        
        # Create today's streak record
        streak = Streak(
            user_id=user.id,
            date=today,
            streak_count=user.current_streak,
            activities_completed=1
        )
        db.session.add(streak)
        
        # Check for streak milestones
        self.check_streak_rewards(user)
    
    def check_streak_rewards(self, user):
        """Check and award streak milestone rewards"""
        milestones = [7, 14, 30, 60, 100]
        
        if user.current_streak in milestones:
            reward_xp = user.current_streak * 2
            user.add_xp(reward_xp)
            
            # Create notification
            self.create_notification(
                user.id,
                'streak_milestone',
                'Streak Milestone!',
                f'Amazing! You\'ve maintained a {user.current_streak}-day streak! Earned {reward_xp} bonus XP.',
                {'streak': user.current_streak, 'reward_xp': reward_xp}
            )
    
    def check_badge_eligibility(self, user):
        """Check if user is eligible for any new badges"""
        # Get all active badges user hasn't earned
        earned_badge_ids = [b.id for b in user.earned_badges]
        available_badges = Badge.query.filter(
            Badge.is_active == True,
            ~Badge.id.in_(earned_badge_ids)
        ).all()
        
        new_badges = []
        
        for badge in available_badges:
            if badge.check_criteria(user):
                self.award_badge(user, badge)
                new_badges.append(badge)
        
        return new_badges
    
    def award_badge(self, user, badge):
        """Award a badge to a user"""
        # Add badge to user
        user.earned_badges.append(badge)
        
        # Award XP
        user.add_xp(badge.xp_value)
        
        # Update badge statistics
        badge.times_earned += 1
        if badge.times_earned == 1:
            badge.first_earned_by_id = user.id
        
        # Create notification
        self.create_notification(
            user.id,
            'badge_earned',
            'Badge Earned!',
            f'Congratulations! You\'ve earned the "{badge.name}" badge!',
            {'badge_id': badge.id, 'badge_name': badge.name, 'xp_value': badge.xp_value}
        )
    
    def check_level_badges(self, user):
        """Check for level-based badges"""
        level_milestones = [5, 10, 25, 50, 100]
        
        if user.level in level_milestones:
            # Look for level-specific badges
            level_badges = Badge.query.filter_by(
                criteria_type='level_threshold',
                criteria_value=user.level,
                is_active=True
            ).all()
            
            for badge in level_badges:
                if badge not in user.earned_badges:
                    self.award_badge(user, badge)
    
    def create_notification(self, user_id, notification_type, title, message, data=None):
        """Create a notification for a user"""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data
        )
        db.session.add(notification)
    
    def update_leaderboards(self, user):
        """Update leaderboards after user progress"""
        # Update global leaderboard
        self.update_global_leaderboard()
        
        # Update class leaderboards for user's classes
        for class_obj in user.enrolled_classes:
            self.update_class_leaderboard(class_obj.id)
    
    def update_global_leaderboard(self):
        """Update global leaderboard"""
        # Get top students by XP
        top_students = db.session.query(User)\
            .filter(User.role == 'student')\
            .order_by(User.xp.desc())\
            .limit(100).all()
        
        rankings = []
        for i, student in enumerate(top_students):
            rankings.append({
                'user_id': student.id,
                'display_name': student.display_name,
                'xp': student.xp,
                'level': student.level,
                'streak': student.current_streak,
                'rank': i + 1,
                'badges': len(student.earned_badges)
            })
        
        # Update or create leaderboard
        leaderboard = Leaderboard.query.filter_by(
            leaderboard_type='global',
            scope_id='global',
            period='all_time'
        ).first()
        
        if leaderboard:
            leaderboard.rankings = rankings
            leaderboard.total_participants = len(rankings)
            leaderboard.last_updated = datetime.utcnow()
        else:
            leaderboard = Leaderboard(
                leaderboard_type='global',
                scope_id='global',
                period='all_time',
                rankings=rankings,
                total_participants=len(rankings)
            )
            db.session.add(leaderboard)
    
    def update_class_leaderboard(self, class_id):
        """Update class-specific leaderboard"""
        from app.models import class_students
        
        # Get students in this class
        students = db.session.query(User)\
            .join(class_students)\
            .filter(class_students.c.class_id == class_id)\
            .order_by(User.xp.desc()).all()
        
        rankings = []
        for i, student in enumerate(students):
            rankings.append({
                'user_id': student.id,
                'display_name': student.display_name,
                'xp': student.xp,
                'level': student.level,
                'streak': student.current_streak,
                'rank': i + 1,
                'badges': len(student.earned_badges)
            })
        
        # Update or create leaderboard
        leaderboard = Leaderboard.query.filter_by(
            leaderboard_type='class',
            scope_id=str(class_id),
            period='all_time'
        ).first()
        
        if leaderboard:
            leaderboard.rankings = rankings
            leaderboard.total_participants = len(rankings)
            leaderboard.last_updated = datetime.utcnow()
        else:
            leaderboard = Leaderboard(
                leaderboard_type='class',
                scope_id=str(class_id),
                period='all_time',
                rankings=rankings,
                total_participants=len(rankings)
            )
            db.session.add(leaderboard)
    
    def create_default_badges(self):
        """Create default system badges"""
        default_badges = [
            {
                'name': 'First Steps',
                'description': 'Complete your first quiz',
                'category': 'achievement',
                'rarity': 'common',
                'xp_value': 25,
                'criteria_type': 'quiz_completion',
                'criteria_value': 1,
                'criteria_description': 'Complete 1 quiz'
            },
            {
                'name': 'Streak Starter',
                'description': 'Maintain a 7-day learning streak',
                'category': 'streak',
                'rarity': 'rare',
                'xp_value': 50,
                'criteria_type': 'streak_days',
                'criteria_value': 7,
                'criteria_description': 'Maintain 7-day streak'
            },
            {
                'name': 'Perfectionist',
                'description': 'Score 100% on a quiz',
                'category': 'achievement',
                'rarity': 'rare',
                'xp_value': 75,
                'criteria_type': 'perfect_scores',
                'criteria_value': 1,
                'criteria_description': 'Score 100% on any quiz'
            },
            {
                'name': 'Level 10 Champion',
                'description': 'Reach level 10',
                'category': 'achievement',
                'rarity': 'epic',
                'xp_value': 100,
                'criteria_type': 'level_threshold',
                'criteria_value': 10,
                'criteria_description': 'Reach level 10'
            },
            {
                'name': 'Math Master',
                'description': 'Complete 10 math quizzes',
                'category': 'subject',
                'rarity': 'rare',
                'xp_value': 75,
                'criteria_type': 'subject_quizzes',
                'criteria_value': 10,
                'criteria_subject': 'Mathematics',
                'criteria_description': 'Complete 10 Mathematics quizzes'
            },
            {
                'name': 'Battle Warrior',
                'description': 'Win 5 quiz battles',
                'category': 'social',
                'rarity': 'epic',
                'xp_value': 100,
                'criteria_type': 'battle_wins',
                'criteria_value': 5,
                'criteria_description': 'Win 5 quiz battles'
            },
            {
                'name': 'Dedication Legend',
                'description': 'Maintain a 30-day streak',
                'category': 'streak',
                'rarity': 'legendary',
                'xp_value': 200,
                'criteria_type': 'streak_days',
                'criteria_value': 30,
                'criteria_description': 'Maintain 30-day streak'
            }
        ]
        
        for badge_data in default_badges:
            existing = Badge.query.filter_by(name=badge_data['name']).first()
            if not existing:
                badge = Badge(**badge_data)
                db.session.add(badge)
        
        db.session.commit()