# 🎓 Gamified Learning System

A comprehensive full-stack edtech platform that gamifies the learning experience with quiz battles, XP systems, badges, and AI-powered features.

## ✨ Features

### 🔐 Authentication & Roles
- **Secure Authentication**: Flask-Login + JWT implementation
- **Role-based Access Control**: Separate interfaces for Teachers and Students
- **Password Security**: Werkzeug password hashing

### 👩‍🏫 Teacher Features
- **Quiz Management**: Create quizzes manually or generate with Gemini AI
- **Class Management**: Create classes with unique join codes
- **Student Progress Dashboard**: Track XP, streaks, and performance
- **Live Leaderboards**: Real-time class rankings
- **AI Insights**: Gemini-powered analytics and recommendations
- **Badge Management**: Create and approve student badges

### 👩‍🎓 Student Features
- **XP & Leveling System**: Earn experience points and unlock levels
- **Quiz Battles**: Real-time peer-vs-peer competitions
- **Streak Tracking**: Daily learning streaks with rewards
- **Badge Collection**: Earn and showcase achievements
- **AI Study Assistant**: Chat with Gemini for learning support
- **Progress Tracking**: Visualize learning journey

### 🛠 Technology Stack

#### Backend
- **Flask**: Web framework with blueprints architecture
- **SQLAlchemy**: ORM with PostgreSQL/MySQL/SQLite support
- **Flask-SocketIO**: Real-time WebSocket communication
- **Flask-JWT-Extended**: JWT authentication
- **Gemini AI**: Quiz generation and insights

#### Frontend
- **React 18**: Modern UI with hooks and context
- **TailwindCSS**: Utility-first styling
- **Vite**: Fast build tool and dev server
- **Chart.js**: Data visualization
- **Socket.IO Client**: Real-time features

#### Database
- **SQLAlchemy Models**: Users, Classes, Quizzes, Battles, Badges
- **Flask-Migrate**: Database migrations
- **Support**: PostgreSQL, MySQL, SQLite

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Clone and navigate to the project**
   ```bash
   git clone <repository-url>
   cd gamified-learning-system
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database (choose one)
   DATABASE_URL=sqlite:///learning_system.db
   # DATABASE_URL=postgresql://user:password@localhost/learning_system
   # DATABASE_URL=mysql://user:password@localhost/learning_system

   # Security (CHANGE IN PRODUCTION!)
   SECRET_KEY=your-super-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here

   # Gemini AI API Key (optional but recommended)
   GEMINI_API_KEY=your-gemini-api-key-here

   # Flask Configuration
   FLASK_APP=app.py
   FLASK_ENV=development
   ```

5. **Initialize database**
   ```bash
   python migrations_setup.py
   ```

6. **Create demo data (optional)**
   ```bash
   python create_demo_data.py
   ```

7. **Start the Flask server**
   ```bash
   flask run
   ```
   Server will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Database Configuration

#### SQLite (Default - for development)
```env
DATABASE_URL=sqlite:///learning_system.db
```

#### PostgreSQL (Recommended for production)
```bash
# Install PostgreSQL and create database
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb learning_system

# Update .env
DATABASE_URL=postgresql://username:password@localhost/learning_system
```

#### MySQL
```bash
# Install MySQL and create database
sudo apt-get install mysql-server
mysql -u root -p -e "CREATE DATABASE learning_system;"

# Update .env
DATABASE_URL=mysql://username:password@localhost/learning_system
```

### Gemini AI Integration

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add to your `.env` file

2. **Features enabled with Gemini AI**
   - Automatic quiz generation
   - AI-powered insights for teachers
   - Student study assistant
   - Smart badge suggestions

### Environment Variables

```env
# Required
DATABASE_URL=your-database-url
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# Optional but recommended
GEMINI_API_KEY=your-gemini-api-key

# Optional
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
FLASK_ENV=development
FLASK_DEBUG=1
```

## 🗄 Database Schema

### Core Models

```python
# Users (teachers and students)
users: id, name, email, password_hash, role, xp, streak, class_id

# Classes managed by teachers
classes: id, name, teacher_id, code, description, created_at

# Student enrollments in classes
enrollments: id, class_id, student_id, enrolled_at

# Quizzes created by teachers
quizzes: id, title, created_by, questions(JSON), class_id, time_limit, xp_reward

# Student quiz results
quiz_results: id, quiz_id, student_id, score, xp_earned, time_taken

# Real-time quiz battles
battles: id, quiz_id, participants(JSON), scores(JSON), winner_id

# Achievement badges
badges: id, name, description, awarded_to, generated_by, approved
```

## 📡 API Endpoints

### Authentication
```
POST /auth/register          # User registration
POST /auth/login            # User login
POST /auth/logout           # User logout
GET  /auth/profile          # Get user profile
POST /auth/join-class       # Join class with code
GET  /auth/validate-token   # Validate JWT token
```

### Teacher Routes
```
GET  /teacher/classes              # Get teacher's classes
POST /teacher/class/create         # Create new class
GET  /teacher/quizzes              # Get teacher's quizzes
POST /teacher/quiz/create          # Create new quiz
POST /teacher/quiz/generate        # AI-generate quiz
GET  /teacher/student/:id/progress # Get student progress
GET  /teacher/class/:id/leaderboard # Get class leaderboard
POST /teacher/badge/create         # Create student badge
GET  /teacher/ai-insights/:id      # Get AI insights for class
```

### Student Routes
```
GET  /student/dashboard        # Get student dashboard
GET  /student/quiz/:id         # Get quiz details
POST /student/quiz/:id/submit  # Submit quiz answers
GET  /student/badges           # Get earned badges
GET  /student/leaderboard      # Get class leaderboard
POST /student/ai-assistant     # Chat with AI assistant
GET  /student/progress         # Get progress data
```

### Battle Routes
```
POST /battle/start            # Start new battle
POST /battle/:id/join         # Join existing battle
POST /battle/:id/submit       # Submit battle answers
GET  /battle/available        # Get available battles
GET  /battle/:id              # Get battle details
```

### WebSocket Events
```
join_battle     # Join battle room
submit_answer   # Submit answer in battle
leave_battle    # Leave battle room
```

## 🧪 Testing

### Demo Accounts

The system includes pre-created demo accounts for testing:

**Teacher Account:**
- Email: `teacher@demo.com`
- Password: `password123`

**Student Accounts:**
- Email: `student1@demo.com` to `student8@demo.com`
- Password: `password123`

### Sample Data

Run the demo data script to populate the database:

```bash
python create_demo_data.py
```

This creates:
- 1 teacher and 8 students
- 2 sample classes with join codes
- Sample quizzes with questions
- Quiz results and badges
- Class enrollments

### Manual Testing

1. **Teacher Flow:**
   - Login as teacher
   - Create a new class
   - Share class code with students
   - Create quizzes (manual or AI-generated)
   - View student progress and leaderboards

2. **Student Flow:**
   - Login as student
   - Join class using code
   - Take available quizzes
   - Participate in quiz battles
   - View badges and progress

3. **Real-time Features:**
   - Multiple students join same battle
   - Real-time score updates
   - Live leaderboard changes

## 🎯 Example Gemini Prompts

### Quiz Generation
```
Generate a quiz about [TOPIC] with the following specifications:
- Difficulty level: [easy/medium/hard]
- Number of questions: [5-10]
- Each question should be multiple choice with 4 options
- Include the correct answer for each question

Return in JSON format with title, description, and questions array.
```

### AI Insights
```
Analyze this class performance data and provide educational insights:
- Class: [CLASS_NAME]
- Total Students: [NUMBER]
- Average Score: [PERCENTAGE]
- Students Needing Help: [NUMBER]

Provide specific recommendations for improving class performance.
```

### Badge Generation
```
Generate achievement badges for students based on performance:
- Quiz completion milestones
- Score achievements
- Streak milestones
- Participation rewards

Include name, description, and criteria for each badge.
```

## 🚀 Deployment

### Development Deployment

```bash
# Backend (Terminal 1)
cd /path/to/project
source venv/bin/activate
flask run

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Production Deployment

1. **Prepare environment**
   ```bash
   export FLASK_ENV=production
   export DATABASE_URL=your-production-db-url
   # Set other production environment variables
   ```

2. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Run with production server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 app:app
   ```

4. **Serve frontend with nginx/Apache**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
       }
   }
   ```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile
FROM python:3.9

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/learning_system
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: learning_system
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check database URL
   echo $DATABASE_URL
   
   # For SQLite, ensure directory exists
   mkdir -p instance
   
   # For PostgreSQL/MySQL, ensure database exists
   ```

2. **Missing Dependencies**
   ```bash
   # Backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend && npm install
   ```

3. **CORS Issues**
   ```python
   # Already configured in app.py
   from flask_cors import CORS
   CORS(app)
   ```

4. **Socket.IO Connection Issues**
   ```javascript
   // Check proxy configuration in vite.config.js
   proxy: {
     '/socket.io': {
       target: 'http://localhost:5000',
       ws: true
     }
   }
   ```

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_user_email ON users(email);
   CREATE INDEX idx_quiz_class ON quizzes(class_id);
   CREATE INDEX idx_result_student ON quiz_results(student_id);
   ```

2. **Frontend Optimization**
   ```bash
   # Build for production
   cd frontend
   npm run build
   
   # Analyze bundle size
   npm install -g webpack-bundle-analyzer
   npx webpack-bundle-analyzer dist/static/js/*.js
   ```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 🎉 Acknowledgments

- Flask and React communities
- TailwindCSS for beautiful styling
- Google Gemini AI for intelligent features
- Socket.IO for real-time capabilities

---

Built with ❤️ for educators and students worldwide!