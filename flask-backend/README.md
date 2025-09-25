# Learn Quest - Flask Backend

A gamified learning platform built with Flask, featuring quizzes, battles, badges, streaks, and AI-powered content generation.

## 🚀 Features

### 🔐 Authentication & User Management
- JWT-based authentication
- Role-based access control (Students & Teachers)
- User profiles with preferences
- Password reset functionality

### 🎓 Learning Management
- **Quiz System**: Create, assign, and take quizzes
- **AI Quiz Generation**: Auto-generate questions with Gemini Pro
- **Class Management**: Create classes, manage students
- **Progress Tracking**: Detailed analytics and insights

### 🎮 Gamification
- **XP & Levels**: Earn experience points and level up
- **Badges**: Achievement system with various categories
- **Streaks**: Daily learning streak tracking
- **Leaderboards**: Global and class-specific rankings

### ⚔️ Social Learning
- **Quiz Battles**: Real-time peer-vs-peer competitions
- **Collaborative Features**: Help classmates, share achievements
- **Notifications**: Real-time updates on progress and achievements

### 🤖 AI Integration
- **Quiz Generation**: Create quizzes with Gemini Pro
- **Badge Suggestions**: AI-generated achievement ideas
- **Class Insights**: Performance analysis and recommendations
- **Study Assistant**: Personalized learning recommendations

## 🛠️ Tech Stack

- **Backend**: Flask 3.0, SQLAlchemy, Flask-JWT-Extended
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI**: Google Gemini Pro
- **Real-time**: Flask-SocketIO
- **Caching**: Redis
- **Task Queue**: Celery (optional)

## 📋 Prerequisites

- Python 3.8+
- Redis server (for caching and real-time features)
- Gemini API key (for AI features)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd flask-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Minimum required:
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Database Setup

```bash
# Initialize database
flask init-db

# Create demo data (optional)
flask create-demo-data
```

### 4. Start the Server

```bash
# Development server
python app.py

# Or using Flask CLI
flask run --host=0.0.0.0 --port=5000
```

The API will be available at `http://localhost:5000`

## 🧪 Demo Accounts

After running `flask create-demo-data`:

- **Teacher**: `teacher@demo.com` / `password123`
- **Student**: `student@demo.com` / `password123`

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
POST /api/auth/refresh      - Refresh JWT token
GET  /api/auth/me           - Get current user info
PUT  /api/auth/me           - Update user profile
POST /api/auth/logout       - Logout user
```

### Quiz Endpoints

```
POST /api/quiz/create       - Create new quiz (teachers)
GET  /api/quiz/list         - Get user's quizzes
GET  /api/quiz/<id>         - Get quiz details
POST /api/quiz/<id>/attempt - Submit quiz attempt (students)
GET  /api/quiz/<id>/results - Get quiz results
PUT  /api/quiz/<id>         - Update quiz (teachers)
DELETE /api/quiz/<id>       - Delete quiz (teachers)
```

### Gamification Endpoints

```
GET  /api/gamification/badges        - Get user badges
POST /api/gamification/badges        - Create custom badge (teachers)
GET  /api/gamification/leaderboard   - Get leaderboards
GET  /api/gamification/stats         - Get user stats
POST /api/gamification/award-badge   - Award badge to student (teachers)
```

### AI Endpoints

```
POST /api/ai/generate-quiz           - Generate quiz with AI
POST /api/ai/generate-badge          - Generate badge suggestion
POST /api/ai/class-insights          - Get class performance insights
POST /api/ai/study-recommendations   - Get personalized study tips
POST /api/ai/explain-concept         - Get concept explanation
```

## 🗄️ Database Schema

### Core Models

- **User**: Authentication, profiles, gamification data
- **Class**: Course management, teacher-student relationships
- **Quiz**: Question sets, assignments, configuration
- **QuizAttempt**: Student responses, scoring, timing
- **Badge**: Achievement definitions, earning criteria
- **Battle**: Real-time quiz competitions
- **Streak**: Daily learning activity tracking
- **Notification**: User alerts and messages
- **Leaderboard**: Rankings and statistics

### Key Relationships

```
User (Teacher) -> Class -> Quiz -> QuizAttempt
User (Student) -> QuizAttempt, Badge, Streak, Battle
```

## 🎮 Gamification System

### XP & Levels
- Base XP per quiz completion
- Perfect score bonuses
- Streak multipliers
- Level-up rewards

### Badge Categories
- **Achievement**: Performance milestones
- **Streak**: Consistency rewards
- **Subject**: Subject-specific mastery
- **Social**: Peer interaction
- **Special**: Unique accomplishments

### Badge Rarity & XP Values
- **Common**: 10-25 XP
- **Rare**: 25-75 XP
- **Epic**: 75-150 XP
- **Legendary**: 150+ XP

## 🤖 AI Integration

### Gemini Pro Features

1. **Quiz Generation**
   - Subject-specific questions
   - Difficulty-appropriate content
   - Explanations and hints

2. **Badge Creation**
   - Achievement suggestions
   - Motivational messaging
   - Rarity assessment

3. **Analytics Insights**
   - Class performance analysis
   - Personalized recommendations
   - Learning path optimization

### Configuration

```bash
# Set your Gemini API key
export GEMINI_API_KEY="your-api-key"

# Or in .env file
GEMINI_API_KEY=your-api-key
```

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
```bash
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/dbname
REDIS_URL=redis://host:port
SECRET_KEY=strong-random-secret
JWT_SECRET_KEY=strong-jwt-secret
```

2. **Database Migration**
```bash
flask deploy
```

3. **Using Gunicorn**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## 📊 Monitoring & Analytics

### Built-in Analytics
- User engagement metrics
- Quiz performance statistics
- Badge earning patterns
- Streak consistency tracking

### Logging
- Application logs with structured format
- Error tracking and alerting
- Performance monitoring

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/

# Specific test file
pytest tests/test_auth.py
```

## 🔧 Development

### Code Structure
```
app/
├── __init__.py         # App factory
├── models.py           # Database models
├── auth/               # Authentication routes
├── quiz/               # Quiz management
├── gamification/       # XP, badges, streaks
├── ai/                 # AI integration
├── battle/             # Real-time competitions
├── analytics/          # Performance insights
└── main/               # Main routes
```

### Adding New Features

1. Create new blueprint in `app/feature/`
2. Define models in `models.py`
3. Create database migration
4. Add routes and business logic
5. Register blueprint in `__init__.py`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Flask community for excellent documentation
- Google for Gemini Pro AI capabilities
- SQLAlchemy for powerful ORM features
- Contributors and testers