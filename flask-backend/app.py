#!/usr/bin/env python3
"""
Learn Quest - Gamified Learning Platform
Flask Application Entry Point
"""

import os
from flask_migrate import upgrade
from app import create_app, db
from app.models import User, Class, Quiz, Badge
from app.gamification.service import GamificationService

app = create_app()

@app.cli.command()
def deploy():
    """Run deployment tasks."""
    # Create database tables
    db.create_all()
    
    # Migrate database to latest revision
    upgrade()
    
    # Create default badges
    gamification_service = GamificationService()
    gamification_service.create_default_badges()
    
    print("Deployment completed successfully!")

@app.cli.command()
def init_db():
    """Initialize the database."""
    db.create_all()
    
    # Create default badges
    gamification_service = GamificationService()
    gamification_service.create_default_badges()
    
    print("Database initialized!")

@app.cli.command()
def create_demo_data():
    """Create demo data for testing."""
    # Create demo teacher
    teacher = User(
        email='teacher@demo.com',
        username='teacher_demo',
        display_name='Demo Teacher',
        role='teacher'
    )
    teacher.set_password('password123')
    db.session.add(teacher)
    
    # Create demo student
    student = User(
        email='student@demo.com',
        username='student_demo',
        display_name='Demo Student',
        role='student',
        xp=2847,
        level=12,
        current_streak=15,
        longest_streak=15
    )
    student.set_password('password123')
    db.session.add(student)
    
    db.session.commit()
    
    # Create demo class
    demo_class = Class(
        name='Algebra I',
        description='Introduction to Algebra concepts',
        subject='Mathematics',
        grade_level='9th Grade',
        teacher_id=teacher.id
    )
    demo_class.generate_class_code()
    demo_class.students.append(student)
    db.session.add(demo_class)
    
    # Create demo quiz
    demo_quiz = Quiz(
        title='Quadratic Functions',
        description='Understanding quadratic functions and their graphs',
        subject='Mathematics',
        difficulty='medium',
        questions=[
            {
                'id': 'q1',
                'question': 'What is the vertex of the parabola y = x² - 4x + 3?',
                'options': ['(2, -1)', '(2, 1)', '(-2, -1)', '(-2, 1)'],
                'correct_answer': 0,
                'explanation': 'To find the vertex, complete the square or use the formula x = -b/2a.',
                'points': 10
            },
            {
                'id': 'q2',
                'question': 'Which direction does the parabola y = -2x² + 4x - 1 open?',
                'options': ['Upward', 'Downward', 'Left', 'Right'],
                'correct_answer': 1,
                'explanation': 'Since the coefficient of x² is negative (-2), the parabola opens downward.',
                'points': 10
            }
        ],
        time_limit=600,
        xp_reward=50,
        perfect_score_bonus=25,
        creator_id=teacher.id,
        class_id=demo_class.id
    )
    db.session.add(demo_quiz)
    
    db.session.commit()
    
    print("Demo data created successfully!")
    print("Teacher login: teacher@demo.com / password123")
    print("Student login: student@demo.com / password123")
    print(f"Class code: {demo_class.class_code}")

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Class': Class,
        'Quiz': Quiz,
        'Badge': Badge,
        'GamificationService': GamificationService
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)