#!/usr/bin/env python3
"""
Database migration setup script
Run this to initialize Flask-Migrate
"""

from flask_migrate import init, migrate, upgrade
from app import app, db
import os

def setup_migrations():
    """Initialize and run database migrations"""
    with app.app_context():
        # Create migrations directory if it doesn't exist
        if not os.path.exists('migrations'):
            print("Initializing Flask-Migrate...")
            init()
        
        # Create initial migration
        print("Creating migration...")
        migrate(message='Initial migration')
        
        # Apply migrations
        print("Applying migrations...")
        upgrade()
        
        print("Database migration setup complete!")

if __name__ == '__main__':
    setup_migrations()