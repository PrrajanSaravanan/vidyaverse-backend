#!/usr/bin/env python3
"""
Application runner script
Handles database initialization and starts the Flask app
"""

import os
from app import app, db
from models import *

def initialize_app():
    """Initialize the application and database"""
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        print("✅ Database tables created/verified")
        
        # Check if demo data exists
        from models import User
        if not User.query.first():
            print("ℹ️  No users found. Run 'python create_demo_data.py' to create demo accounts")
        else:
            teacher_count = User.query.filter_by(role='teacher').count()
            student_count = User.query.filter_by(role='student').count()
            print(f"ℹ️  Database has {teacher_count} teachers and {student_count} students")

if __name__ == '__main__':
    print("🚀 Starting Gamified Learning System...")
    
    # Initialize database
    initialize_app()
    
    # Start the application
    print("🌐 Server starting on http://localhost:5000")
    print("📱 Frontend should be running on http://localhost:3000")
    print("🔧 Press Ctrl+C to stop the server")
    
    # Run with SocketIO support
    from app import socketio
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)