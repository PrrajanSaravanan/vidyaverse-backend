#!/usr/bin/env python3
"""
Learn Quest Flask Application Runner
Simple script to run the Flask development server
"""

from app import create_app, socketio
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() in ['true', '1', 'on']
    
    print("🎓 Learn Quest - Gamified Learning Platform")
    print(f"🚀 Starting server on http://localhost:{port}")
    print(f"🔧 Debug mode: {'ON' if debug else 'OFF'}")
    print("\n📋 Available demo accounts:")
    print("   Teacher: teacher@demo.com / password123")
    print("   Student: student@demo.com / password123")
    print("\n💡 Run 'flask create-demo-data' if demo accounts don't exist")
    print("=" * 50)
    
    # Use socketio.run for real-time features
    socketio.run(app, 
                debug=debug, 
                host='0.0.0.0', 
                port=port,
                allow_unsafe_werkzeug=True)