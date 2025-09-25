# UI Layouts & Dashboard Designs

## 🎓 Teacher Dashboard Layouts

### 1. Main Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Header Navigation                                                │
│ [Logo] Learn Quest    [Classes ▼] [Create +] [Profile] [⚙️]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│ │ Active Students │ │ Weekly Quizzes  │ │ Avg Class Score │    │
│ │      124        │ │       18        │ │      87%        │    │
│ │   ↗️ +12 today   │ │   📊 +3 new    │ │   ↗️ +5% trend   │    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 Class Performance Overview                                │ │
│ │ ┌─────────────────────┐ ┌─────────────────────────────────┐ │ │
│ │ │ Weekly Activity     │ │ Subject Performance             │ │ │
│ │ │ [Line Chart showing │ │ [Bar chart showing Math: 92%,   │ │ │
│ │ │  daily engagement]  │ │  Science: 85%, History: 78%]   │ │ │
│ │ └─────────────────────┘ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Quick Actions                                            │ │
│ │ [Create Quiz] [Start Battle] [View Analytics] [Manage Badges]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 Recent Activity & Alerts                                 │ │
│ │ • Sarah completed Math Quiz #5 with 98% score ⭐           │ │
│ │ • 5 students maintained 7-day streak 🔥                    │ │
│ │ • Science quiz needs review - avg score 65% ⚠️             │ │
│ │ • New badge "Problem Solver" earned by 3 students 🏆       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Quiz Creation Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard    Create New Quiz    [Save Draft] [Publish] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Quiz Setup                                              │ │
│ │ Title: [Advanced Algebra Concepts                        ] │ │
│ │ Subject: [Mathematics ▼]  Grade: [9th Grade ▼]            │ │
│ │ Difficulty: ○ Easy ● Medium ○ Hard                         │ │
│ │ Time Limit: [30] minutes  XP Reward: [50] points          │ │
│ │ Assign To: ○ Entire Class ● Specific Students [Select...] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI Quiz Generator                                       │ │
│ │ Generate questions about: [Quadratic equations and graphs]  │ │
│ │ Number of questions: [5 ▼]  [Generate with AI] [Manual Add] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 Question Editor                                         │ │
│ │ Question 1 of 5                           [← Prev] [Next →] │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ What is the vertex of the parabola y = x² - 4x + 3?   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ○ A) (2, -1)  ● B) (2, 1)  ○ C) (-2, -1)  ○ D) (-2, 1)  │ │
│ │ Explanation: [The vertex form shows the minimum point...] │ │
│ │ Points: [10] Time Limit: [60s] [🗑️ Delete] [📋 Duplicate] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚙️ Advanced Settings                                       │ │
│ │ ☑️ Allow retakes  ☑️ Show correct answers  ☑️ Shuffle Qs   │ │
│ │ Available: [Now ▼] Until: [Dec 15, 2024 ▼]                │ │
│ │ Battle Mode: ☑️ Enable peer-vs-peer battles               │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Class Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ Class Analytics - Algebra I (Period 3)    [📊 Export] [📧 Share] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│ │ Class Average   │ │ Completion Rate │ │ Active Streaks  │    │
│ │     84.5%       │ │      92%        │ │   18/25 students│    │
│ │  ↗️ +3.2% week   │ │   ↗️ +8% week    │ │   🔥 Avg: 12 days│    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📈 Performance Trends (Last 30 Days)                       │ │
│ │ [Interactive line chart showing score trends over time]     │ │
│ │ 🔍 Insights: Steady improvement in problem-solving questions│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏆 Top Performers                🚨 Needs Attention        │ │
│ │ 1. Sarah M. - 97.3% avg         • Jake L. - 58% avg        │ │
│ │ 2. Alex K. - 94.8% avg          • Maria S. - 62% avg       │ │
│ │ 3. Emma R. - 93.1% avg          • Tyler B. - 64% avg       │ │
│ │ [View Full Rankings]            [Create Support Plan]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI Insights & Recommendations                           │ │
│ │ "Your class shows strong performance in linear equations    │ │
│ │ but struggles with quadratic applications. Consider more    │ │
│ │ visual problems and real-world scenarios for improvement."  │ │
│ │ [Generate Practice Quiz] [Create Targeted Badge]           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Badge Management Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ Badge Management                [Create New] [AI Suggest] [Import]│
├─────────────────────────────────────────────────────────────────┤
│ 🏆 Active Badges (12)    🎯 Pending Approval (3)    📊 Analytics  │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Active Badges                                               │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │ │
│ │ │  🔥 Streak  │ │ 🧮 Math Pro │ │ 🚀 Fast Learner│ │ + More  │ │ │
│ │ │   Master    │ │   Level 1   │ │  Speed Demon │ │         │ │ │
│ │ │ Earned: 18x │ │ Earned: 25x │ │  Earned: 12x │ │ [View]  │ │ │
│ │ │[Edit][View] │ │[Edit][View] │ │ [Edit][View] │ │         │ │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI Badge Suggestions                                    │ │
│ │ Based on recent student activity, here are new badge ideas: │ │
│ │ • "Collaboration Champion" - Help 5 classmates             │ │
│ │ • "Error Detective" - Learn from 10 mistakes              │ │
│ │ • "Late Night Scholar" - Complete evening quizzes          │ │
│ │ [Create All] [Review Each] [Generate More]                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Badge Editor - "Problem Solver Pro"                        │ │
│ │ Name: [Problem Solver Pro                               ]  │ │
│ │ Description: [Master complex multi-step problems        ]  │ │
│ │ Icon: [🧩] Category: [Achievement ▼] Rarity: [Rare ▼]      │ │
│ │ Criteria: [Complete 10 hard-level quizzes with 90%+ score] │ │
│ │ XP Value: [75] Available to: ○ All Classes ● This Class   │ │
│ │ [Preview] [Save] [Cancel]                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👩‍🎓 Student Dashboard Layouts

### 1. Main Student Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ [🏠] Learn Quest    Welcome back, Sarah! 🌟    [⚙️] [🔔3] [👤]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Your Progress                                           │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ │ Level 12        │ │ XP: 2,847       │ │ Streak: 🔥 15   │ │ │
│ │ │ [████████░░] 89%│ │ Next: 153 XP    │ │ Don't break it! │ │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📚 Today's Learning                                        │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 📝 Math Quiz: Quadratic Functions          [Take Quiz] │ │ │
│ │ │ Due: Today, 11:59 PM • 10 questions • ~15 min          │ │ │
│ │ │ XP Reward: 50 points + bonus for speed! ⚡              │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ ⚔️ Battle Arena: Science Showdown          [Join Battle]│ │ │
│ │ │ Live now! 4 players waiting • Biology topic             │ │ │
│ │ │ Prize: 100 XP + exclusive badge 🏆                      │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🤖 AI Study Assistant                    [Ask Question] │ │ │
│ │ │ "Need help with today's math problems?                  │ │ │
│ │ │ I can create practice questions just for you!"          │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏆 Recent Achievements                     [View All Badges]│ │
│ │ 🔥 Streak Master (NEW!)  🧮 Math Wizard  ⚡ Speed Demon    │ │
│ │ "You're on fire! 15 days of consistent learning!"          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👥 Class Leaderboard (Algebra I)                          │ │
│ │ 🥇 Sarah M. (You!) - 2,847 XP  🔥15     [View Full Board] │ │
│ │ 🥈 Alex K. - 2,756 XP  🔥12                               │ │
│ │ 🥉 Emma R. - 2,689 XP  🔥8                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Quiz Taking Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ Math Quiz: Quadratic Functions                    [Pause] [Help] │
│ Question 3 of 10 • Time: 2:15 remaining • XP So Far: 30 points  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Progress: [██████░░░░] 30%                                  │ │
│ │ Streak Bonus: 🔥 +10% XP for maintaining 15-day streak!    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ What is the vertex of the parabola y = 2(x - 3)² + 1?     │ │
│ │                                                             │ │
│ │ ○ A) (3, 1)     [Select this answer]                       │ │
│ │ ○ B) (-3, 1)    [Select this answer]                       │ │
│ │ ○ C) (3, -1)    [Select this answer]                       │ │
│ │ ○ D) (-3, -1)   [Select this answer]                       │ │
│ │                                                             │ │
│ │ 💡 Need a hint? Click here (costs 2 XP)                   │ │
│ │ 🤖 Ask AI for help (costs 5 XP)                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Quick Tools:                                               │ │
│ │ [📝 Scratch Pad] [🧮 Calculator] [📐 Formulas] [⏭️ Skip] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 Live Stats:                                             │ │
│ │ Accuracy: 67% (2/3) • Avg Time: 1m 23s • Speed Bonus: 🚀  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                         [Submit Answer]                         │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Battle Arena Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚔️ BATTLE ARENA - Science Showdown                     [Leave] │
│ Question 2 of 5 • Battle Time: 0:28 remaining                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏆 Live Leaderboard                                        │ │
│ │ 1. Sarah M. (You!) - 180 pts  ⚡🔥                         │ │
│ │ 2. Mike L. - 165 pts  ⚡                                   │ │
│ │ 3. Jenny K. - 140 pts                                      │ │
│ │ 4. Tom R. - 120 pts                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Which organelle is responsible for cellular respiration?    │ │
│ │                                                             │ │
│ │ 🅰️ Mitochondria     [QUICK SELECT - A]                     │ │
│ │ 🅱️ Nucleus          [QUICK SELECT - B]                     │ │
│ │ 🅲 Ribosome         [QUICK SELECT - C]                     │ │
│ │ 🅳 Golgi Apparatus  [QUICK SELECT - D]                     │ │
│ │                                                             │ │
│ │ ⏱️ Answer quickly for bonus points!                        │ │
│ │ [████████░░] 80% time bonus zone                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💬 Live Chat                                               │ │
│ │ Mike: "This is intense! Good luck everyone! 😅"            │ │
│ │ Jenny: "You're crushing it Sarah! 🔥"                      │ │
│ │ [Type message...] [Send]                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Badge Showcase
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏆 Sarah's Badge Collection        [Share] [Print Certificate]  │
│ Total Badges: 47 • Rare: 8 • Epic: 3 • Legendary: 1            │
├─────────────────────────────────────────────────────────────────┤
│ 🎯 Recently Earned (This Week)     📊 Progress Tracking          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔥 Streak Master                                 [LEGENDARY] │ │
│ │ "Maintained 15-day learning streak"                         │ │
│ │ Earned: Today • XP Bonus: +150 • Rarity: Ultra Rare        │ │
│ │ You're the first in your class to earn this! 🌟            │ │
│ │ [Share Achievement] [View Certificate]                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Badge Categories:                                           │ │
│ │ 📚 Academic (12)    🏃 Speed (8)     🤝 Social (6)         │ │
│ │ 🎯 Achievement (15) 🔥 Streaks (4)   ⭐ Special (2)        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Badge Progress - Almost There!                          │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🧮 Math Master Pro                         [87% Complete]│ │ │
│ │ │ Complete 20 advanced math quizzes (17/20)               │ │ │
│ │ │ [████████░░] 3 more to go!                              │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🤝 Helpful Classmate                       [60% Complete]│ │ │
│ │ │ Help 10 classmates with study questions (6/10)          │ │ │
│ │ │ [██████░░░░] Help 4 more friends!                       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🌟 Featured Badge Collection                               │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌─────┐ │ │
│ │ │🔥RARE │ │⚡EPIC │ │🧮RARE │ │🎯EPIC │ │🚀RARE │ │+42  │ │ │
│ │ │Streak │ │Speed  │ │Math   │ │Perfect│ │Battle │ │More │ │ │
│ │ │Master │ │Demon  │ │Wizard │ │Week   │ │Champ  │     │ │ │
│ │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └─────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5. AI Study Assistant Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI Study Assistant - Your Personal Learning Coach           │
│ [🏠 Home] [📝 Practice] [💡 Hints] [📊 Progress] [⚙️ Settings]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💬 Chat with AI                                            │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🤖 AI: Hi Sarah! I noticed you're working on quadratic │ │ │
│ │ │     functions. How can I help you master this topic    │ │ │
│ │ │     today? I can create practice problems, explain     │ │ │
│ │ │     concepts, or help with homework!                   │ │ │
│ │ │                                              2:15 PM   │ │ │
│ │ │                                                         │ │ │
│ │ │ 👤 You: I'm struggling with finding vertices. Can you  │ │ │
│ │ │         create some practice problems for me?          │ │ │
│ │ │                                              2:16 PM   │ │ │
│ │ │                                                         │ │ │
│ │ │ 🤖 AI: Perfect! Let me create 3 practice problems     │ │ │
│ │ │     specifically for vertex form. I'll start easy     │ │ │
│ │ │     and gradually increase difficulty...               │ │ │
│ │ │                                              2:16 PM   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ [Type your question...                           ] [Send] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Personalized Practice                                   │ │
│ │ Based on your recent quiz performance:                      │ │
│ │                                                             │ │
│ │ 📝 Recommended Practice:                                   │ │
│ │ • Vertex form identification (3 problems) [Start Now]      │ │ │
│ │ • Graphing parabolas (5 problems) [Start Now]             │ │ │
│ │ • Word problems with quadratics (2 problems) [Start Now]   │ │ │
│ │                                                             │ │
│ │ 🔄 Daily Review: [Generate Review Quiz]                    │ │
│ │ 💪 Challenge Mode: [Hard Problems - 50 XP Bonus]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 Your Learning Insights                                  │ │
│ │ Strong Areas: Linear functions, basic graphing              │ │
│ │ Growth Areas: Complex word problems, systems of equations   │ │
│ │ Study Pattern: You learn best with visual examples! 📈     │ │
│ │ Suggestion: Try graphing tools for better understanding     │ │ │
│ │ [Update Learning Preferences] [Get Study Schedule]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎮 Quick Actions                                           │ │
│ │ [📚 Explain Concept] [🧮 Practice Problems] [🎯 Take Quiz] │ │
│ │ [💡 Get Hints] [🏆 Challenge Friend] [📋 Study Plan]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile-Responsive Considerations

### Mobile Layout Adaptations
```
📱 Mobile Dashboard (Student):
┌─────────────────────┐
│ Learn Quest    [⚙️🔔👤] │
├─────────────────────┤
│ 👋 Hi Sarah!        │
│                     │
│ ┌─────────────────┐ │
│ │ Level 12 (89%)  │ │
│ │ XP: 2,847       │ │
│ │ Streak: 🔥 15   │ │
│ └─────────────────┘ │
│                     │
│ 📚 Today's Tasks    │
│ ┌─────────────────┐ │
│ │ Math Quiz       │ │
│ │ 10 questions    │ │
│ │ [Take Quiz]     │ │
│ └─────────────────┘ │
│                     │
│ ⚔️ Battle Arena     │
│ ┌─────────────────┐ │
│ │ Science Battle  │ │
│ │ 4 players       │ │
│ │ [Join Now]      │ │
│ └─────────────────┘ │
│                     │
│ 🏆 Recent Badges    │
│ [🔥][🧮][⚡][🎯]    │
│                     │
│ [🏠][📚][⚔️][🏆][👤] │
└─────────────────────┘
```

### Touch-Optimized Features
- Large tap targets (minimum 44px)
- Swipe gestures for navigation
- Pull-to-refresh functionality
- Optimized quiz interface for thumbs
- Quick action buttons
- Voice input for AI assistant
- Offline mode capabilities
- Push notifications for streaks and assignments

---

## 🎨 Design System & Branding

### Color Palette
```
Primary Colors:
- Primary Blue: #2563EB (Main CTAs, headers)
- Success Green: #10B981 (Achievements, positive feedback)
- Warning Orange: #F59E0B (Alerts, attention needed)
- Error Red: #EF4444 (Mistakes, urgent issues)

Secondary Colors:
- Streak Fire: #F97316 (Streak indicators)
- XP Gold: #F59E0B (Experience points)
- Badge Purple: #8B5CF6 (Rare achievements)
- Battle Red: #DC2626 (Competition mode)

Neutral Colors:
- Gray 50: #F9FAFB (Backgrounds)
- Gray 200: #E5E7EB (Borders, dividers)
- Gray 600: #4B5563 (Secondary text)
- Gray 900: #111827 (Primary text)
```

### Typography
```
Headings: Inter, Bold
- H1: 32px (Main titles)
- H2: 24px (Section headers)
- H3: 20px (Subsections)

Body Text: Inter, Regular
- Large: 18px (Important content)
- Normal: 16px (Standard text)
- Small: 14px (Captions, metadata)

Special:
- Code/Math: JetBrains Mono
- Numbers: Tabular nums variant
```

### Iconography
```
System Icons: Heroicons (outline for secondary, solid for primary)
Gamification Icons: Custom emoji-style
- 🏆 Achievements
- 🔥 Streaks
- ⚡ Speed/Quick actions
- 🎯 Goals/Targets
- 🚀 Progress/Growth
- 🧮 Math/STEM subjects
- 📚 Learning/Education
```

This comprehensive UI design system provides a solid foundation for implementing the gamified learning platform with engaging, accessible, and intuitive user interfaces for both teachers and students.