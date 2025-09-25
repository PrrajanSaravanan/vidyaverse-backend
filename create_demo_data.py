#!/usr/bin/env python3
"""
Demo data creation script
Creates sample users, classes, quizzes, and results for testing
"""

from app import app, db
from models import User, Class, Quiz, QuizResult, Badge, Enrollment
from werkzeug.security import generate_password_hash
import json
import string
import random

def generate_class_code():
    """Generate a unique 6-character class code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Class.query.filter_by(code=code).first():
            return code

def create_demo_data():
    """Create demo data for testing"""
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        print("Creating demo users...")
        
        # Create demo teacher
        teacher = User(
            name="John Smith",
            email="teacher@demo.com",
            password_hash=generate_password_hash("password123"),
            role="teacher"
        )
        db.session.add(teacher)
        db.session.commit()
        
        # Create demo students
        students = []
        student_names = [
            "Alice Johnson", "Bob Wilson", "Carol Davis", "David Brown",
            "Emma Taylor", "Frank Miller", "Grace Lee", "Henry Clark"
        ]
        
        for i, name in enumerate(student_names):
            student = User(
                name=name,
                email=f"student{i+1}@demo.com",
                password_hash=generate_password_hash("password123"),
                role="student",
                xp=random.randint(100, 1500),
                streak=random.randint(0, 15)
            )
            students.append(student)
            db.session.add(student)
        
        db.session.commit()
        
        print("Creating demo classes...")
        
        # Create demo classes
        classes = [
            {
                "name": "Mathematics 101",
                "description": "Introduction to basic mathematics concepts",
                "code": generate_class_code()
            },
            {
                "name": "Science Fundamentals",
                "description": "Basic science principles and experiments",
                "code": generate_class_code()
            }
        ]
        
        demo_classes = []
        for cls_data in classes:
            cls = Class(
                name=cls_data["name"],
                description=cls_data["description"],
                teacher_id=teacher.id,
                code=cls_data["code"]
            )
            demo_classes.append(cls)
            db.session.add(cls)
        
        db.session.commit()
        
        print("Enrolling students in classes...")
        
        # Enroll students in classes
        for student in students:
            for cls in demo_classes:
                enrollment = Enrollment(
                    class_id=cls.id,
                    student_id=student.id
                )
                db.session.add(enrollment)
        
        db.session.commit()
        
        print("Creating demo quizzes...")
        
        # Create demo quizzes
        quiz_data = [
            {
                "title": "Basic Arithmetic",
                "description": "Test your addition and subtraction skills",
                "questions": [
                    {
                        "question": "What is 5 + 3?",
                        "options": ["6", "7", "8", "9"],
                        "correct_answer": 2
                    },
                    {
                        "question": "What is 10 - 4?",
                        "options": ["5", "6", "7", "8"],
                        "correct_answer": 1
                    },
                    {
                        "question": "What is 2 × 4?",
                        "options": ["6", "7", "8", "9"],
                        "correct_answer": 2
                    }
                ],
                "class_id": demo_classes[0].id,
                "is_battle_enabled": True
            },
            {
                "title": "Science Quiz",
                "description": "Basic science knowledge test",
                "questions": [
                    {
                        "question": "What is the chemical symbol for water?",
                        "options": ["H2O", "CO2", "O2", "N2"],
                        "correct_answer": 0
                    },
                    {
                        "question": "How many planets are in our solar system?",
                        "options": ["7", "8", "9", "10"],
                        "correct_answer": 1
                    }
                ],
                "class_id": demo_classes[1].id,
                "is_battle_enabled": False
            }
        ]
        
        demo_quizzes = []
        for quiz_info in quiz_data:
            quiz = Quiz(
                title=quiz_info["title"],
                description=quiz_info["description"],
                questions=json.dumps(quiz_info["questions"]),
                created_by=teacher.id,
                class_id=quiz_info["class_id"],
                is_battle_enabled=quiz_info["is_battle_enabled"],
                time_limit=300,
                xp_reward=50
            )
            demo_quizzes.append(quiz)
            db.session.add(quiz)
        
        db.session.commit()
        
        print("Creating demo quiz results...")
        
        # Create some quiz results
        for student in students[:4]:  # Only for first 4 students
            for quiz in demo_quizzes:
                score = random.randint(60, 100)
                xp_earned = 50 + (score - 60) // 10 * 5  # Bonus XP for higher scores
                
                result = QuizResult(
                    quiz_id=quiz.id,
                    student_id=student.id,
                    score=score,
                    answers=json.dumps([0, 1] * (len(json.loads(quiz.questions)) // 2 + 1)),
                    xp_earned=xp_earned,
                    time_taken=random.randint(120, 280)
                )
                db.session.add(result)
        
        db.session.commit()
        
        print("Creating demo badges...")
        
        # Create some demo badges
        badge_types = [
            {"name": "First Steps", "description": "Completed your first quiz!"},
            {"name": "High Achiever", "description": "Scored 90% or higher!"},
            {"name": "Quick Learner", "description": "Completed quiz in under 2 minutes!"},
        ]
        
        for student in students[:3]:  # Award badges to first 3 students
            for badge_data in badge_types:
                badge = Badge(
                    name=badge_data["name"],
                    description=badge_data["description"],
                    awarded_to=student.id,
                    generated_by="teacher",
                    approved=True
                )
                db.session.add(badge)
        
        db.session.commit()
        
        print("\nDemo data created successfully!")
        print("\nDemo Accounts:")
        print("Teacher: teacher@demo.com / password123")
        print("Students: student1@demo.com to student8@demo.com / password123")
        print(f"\nClass Codes:")
        for cls in demo_classes:
            print(f"- {cls.name}: {cls.code}")

if __name__ == '__main__':
    create_demo_data()