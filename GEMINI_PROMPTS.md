# Gemini Pro Prompts for Gamified Learning System

## 🧠 Quiz Generation Prompts

### 1. General Quiz Generation
```
Generate {questionCount} {difficulty} level multiple choice questions about {subject}.

Context:
- Target audience: {gradeLevel} students
- Subject: {subject}
- Difficulty: {difficulty}
- Topic focus: {topic}
- Time per question: {timeLimit} seconds

Requirements:
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Make questions engaging and educational
- Vary question types and complexity within the {difficulty} level
- Ensure questions are age-appropriate for {gradeLevel}
- Focus on practical application rather than pure memorization

Difficulty Guidelines:
- Easy: Basic recall, simple concepts, straightforward language
- Medium: Application of knowledge, moderate analysis, some critical thinking
- Hard: Complex problem-solving, synthesis of multiple concepts, advanced analysis

Return the response in this exact JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear explanation of why this answer is correct and why others are wrong",
      "points": 1,
      "category": "concept_category",
      "estimatedTime": 45
    }
  ]
}

Example subjects and appropriate question types:
- Mathematics: Problem-solving, calculations, geometry, algebra
- Science: Experiments, scientific method, biology, chemistry, physics
- History: Events, dates, cause-and-effect, historical figures
- Literature: Reading comprehension, literary devices, author analysis
- Geography: Countries, capitals, climate, natural features
```

### 2. Subject-Specific Quiz Prompts

#### Mathematics Quiz
```
Create {questionCount} mathematics questions for {gradeLevel} students at {difficulty} difficulty.

Focus areas: {mathTopics} (e.g., algebra, geometry, statistics, calculus)

Requirements:
- Include step-by-step solutions in explanations
- Use real-world applications when possible
- Ensure calculations are appropriate for the grade level
- Include visual problems when applicable (describe diagrams)
- Mix different mathematical concepts within the difficulty range

Question types to include:
- Word problems with practical applications
- Direct calculation questions
- Concept understanding questions
- Problem-solving scenarios

Example format for math explanations:
"To solve this, we need to: 1) Identify the given information, 2) Apply the formula [formula], 3) Calculate step by step, 4) Check our answer makes sense in context."
```

#### Science Quiz
```
Generate {questionCount} science questions covering {scienceSubject} for {gradeLevel} students.

Scientific domains: {domains} (e.g., biology, chemistry, physics, earth science)

Requirements:
- Include scientific method concepts
- Use current scientific understanding
- Include experimental scenarios
- Connect to real-world phenomena
- Include visual descriptions when helpful

Question categories:
- Scientific process and methodology
- Factual knowledge and terminology
- Application of scientific principles
- Analysis of experimental data
- Environmental and health connections

Example explanation format:
"This demonstrates the principle of [scientific concept]. In this scenario, [explanation of what's happening scientifically]. This is important because [real-world relevance]."
```

#### Language Arts Quiz
```
Create {questionCount} language arts questions for {gradeLevel} students focusing on {literatureTopics}.

Areas to cover: {topics} (e.g., reading comprehension, grammar, writing, literary analysis)

Requirements:
- Include passage-based questions when appropriate
- Cover various literary devices and techniques
- Include grammar and mechanics
- Test critical thinking about texts
- Use age-appropriate literary excerpts

Question types:
- Reading comprehension with short passages
- Grammar and sentence structure
- Vocabulary in context
- Literary device identification
- Author's purpose and tone analysis
```

### 3. Adaptive Quiz Generation
```
Generate an adaptive quiz for student with the following profile:

Student Performance Data:
- Current level: {studentLevel}
- Strong subjects: {strongSubjects}
- Weak areas: {weakAreas}
- Recent quiz scores: {recentScores}
- Learning style indicators: {learningStyle}

Create {questionCount} questions that:
- 60% focus on weak areas for improvement
- 30% reinforce strong areas for confidence
- 10% introduce new challenging concepts
- Gradually increase difficulty based on performance
- Include varied question types to match learning style

Adaptive elements:
- Start with moderate difficulty and adjust
- Provide scaffolding hints for struggling areas
- Include multi-modal question descriptions
- Connect new concepts to known strengths
```

## 🏆 Badge Generation Prompts

### 1. Achievement Badge Creation
```
Create a gamification badge for the following achievement: "{achievement}"

Context:
- Category: {category} (achievement, streak, subject, social, special)
- Subject area: {subject}
- Target students: {gradeLevel}
- Achievement context: {context}

Badge categories and their characteristics:
- Achievement: Performance milestones, mastery demonstrations
- Streak: Consistency rewards, habit formation
- Subject: Subject-specific expertise, topic mastery
- Social: Collaboration, helping others, peer interaction
- Special: Unique accomplishments, creativity, going above and beyond

Create a badge that is:
- Motivating and inspiring
- Clear in its requirements
- Achievable but challenging
- Relevant to learning goals
- Appealing to students

Return in this JSON format:
{
  "name": "Badge Name (2-4 words, memorable)",
  "description": "Engaging description of what this badge represents (1-2 sentences)",
  "criteria": "Specific, measurable criteria for earning this badge",
  "rarity": "common/rare/epic/legendary",
  "xpValue": 50,
  "motivationalMessage": "Congratulatory message when earned",
  "iconDescription": "Description of visual design for the badge icon",
  "celebrationText": "Fun text for the achievement animation"
}

Rarity guidelines:
- Common: Basic achievements, easy to earn (10-25 XP)
- Rare: Solid accomplishments, moderate effort (25-50 XP)
- Epic: Significant achievements, substantial effort (50-100 XP)
- Legendary: Exceptional accomplishments, rare feats (100+ XP)
```

### 2. Streak Badge Variations
```
Design streak-based badges for consistent learning habits:

Streak Types:
- Daily login streaks: {streakDays} days
- Quiz completion streaks: {completionStreak}
- Perfect score streaks: {perfectStreak}
- Study session streaks: {studyStreak}

Create badges that:
- Celebrate consistency over perfection
- Acknowledge different streak milestones (7, 14, 30, 60, 100 days)
- Include recovery encouragement for broken streaks
- Recognize different types of engagement

Special considerations:
- Weekend and holiday adjustments
- Grace periods for illness or emergencies
- Progressive rewards for longer streaks
- Motivational messaging that emphasizes growth mindset
```

### 3. Subject Mastery Badges
```
Create subject mastery badges for {subject} with these learning objectives:

Learning Standards: {standards}
Key Concepts: {concepts}
Skill Levels: Beginner → Intermediate → Advanced → Expert

Design a progression of badges that:
- Recognize incremental skill development
- Celebrate deep understanding over memorization
- Include practical application achievements
- Acknowledge creative problem-solving
- Reward teaching and helping others

Badge progression example:
1. Explorer: First steps in the subject
2. Practitioner: Regular engagement and improvement
3. Scholar: Deep understanding and analysis
4. Expert: Mastery and ability to teach others
5. Innovator: Creative application and original thinking

Include micro-badges for specific skills within each level.
```

## 📊 Analytics & Insights Prompts

### 1. Class Performance Analysis
```
Analyze this class performance data and provide educational insights:

Class Profile:
- Class name: {className}
- Grade level: {gradeLevel}
- Subject: {subject}
- Number of students: {studentCount}
- Time period: {timePeriod}

Performance Metrics:
- Average quiz score: {avgScore}%
- Completion rate: {completionRate}%
- Active participation: {participationRate}%
- Streak consistency: {streakData}

Subject Performance Breakdown:
{subjectBreakdown}

Individual Performance Ranges:
- Top performers (90%+): {topPerformers}
- Solid performers (70-89%): {solidPerformers}
- Developing learners (50-69%): {developingLearners}
- Students needing support (<50%): {needSupport}

Engagement Patterns:
- Most active time of day: {activeTime}
- Preferred question types: {questionPreferences}
- Average session length: {sessionLength}

Provide insights in this JSON format:
{
  "overallAssessment": "Comprehensive assessment of class performance and trends",
  "strengths": ["Specific areas where the class excels"],
  "challengeAreas": ["Areas requiring focused attention and support"],
  "recommendations": [
    {
      "category": "instruction/engagement/assessment/differentiation",
      "action": "Specific actionable recommendation",
      "rationale": "Educational reasoning behind this recommendation",
      "implementation": "How to implement this recommendation",
      "expectedOutcome": "What improvement to expect",
      "priority": "high/medium/low",
      "timeframe": "immediate/short-term/long-term"
    }
  ],
  "differentiationStrategies": ["Strategies for different learning levels"],
  "engagementBoosts": ["Ideas to increase student engagement"],
  "assessmentSuggestions": ["Alternative assessment approaches"],
  "parentCommunication": "Key points to share with parents",
  "nextSteps": ["Immediate action items for the teacher"]
}

Consider:
- Learning theory and best practices
- Individual student needs and learning styles
- Classroom management strategies
- Technology integration opportunities
- Assessment for learning principles
```

### 2. Individual Student Analysis
```
Create a personalized learning profile and recommendations for this student:

Student Profile:
- Name: {studentName}
- Grade: {grade}
- Current level: {currentLevel}
- Total XP: {totalXP}
- Time in system: {timeInSystem}

Academic Performance:
- Overall average: {overallAverage}%
- Subject strengths: {strongSubjects}
- Challenge areas: {challengeAreas}
- Recent score trend: {scoreTrend}
- Preferred difficulty: {preferredDifficulty}

Engagement Metrics:
- Current streak: {currentStreak} days
- Longest streak: {longestStreak} days
- Quiz completion rate: {completionRate}%
- Average session time: {avgSessionTime}
- Badges earned: {badgeCount}

Learning Patterns:
- Most active times: {activeTimes}
- Preferred question types: {questionTypes}
- Response time patterns: {responsePatterns}
- Help-seeking behavior: {helpSeeking}

Generate personalized recommendations in JSON format:
{
  "learnerProfile": "Comprehensive description of this student's learning style and preferences",
  "strengthsToLeverage": ["Specific academic and behavioral strengths to build upon"],
  "growthOpportunities": ["Areas for development with specific focus"],
  "personalizedStrategies": [
    {
      "area": "subject/skill/behavior area",
      "strategy": "Specific learning strategy tailored to this student",
      "rationale": "Why this strategy fits this student",
      "implementation": "How to put this strategy into practice",
      "measureOfSuccess": "How to know if it's working"
    }
  ],
  "motivationalApproaches": ["Strategies to keep this student engaged"],
  "challengeLevelAdjustments": "Recommended difficulty modifications",
  "supportNeeds": ["Areas where additional support might be beneficial"],
  "goalSetting": {
    "shortTerm": ["Achievable goals for next 1-2 weeks"],
    "mediumTerm": ["Goals for next month"],
    "longTerm": ["Semester or year-long objectives"]
  },
  "parentPartnership": "Suggestions for how parents can support learning at home",
  "celebrationPlan": "How to recognize and celebrate this student's progress"
}
```

### 3. Learning Recommendation Engine
```
Generate personalized learning recommendations based on this student's data:

Current Status:
- Knowledge gaps: {knowledgeGaps}
- Learning velocity: {learningVelocity}
- Motivation level: {motivationLevel}
- Time availability: {timeAvailability}
- Learning preferences: {learningPreferences}

Generate adaptive recommendations:

{
  "immediateActions": [
    {
      "activity": "Specific learning activity or quiz topic",
      "duration": "Estimated time needed",
      "difficulty": "Recommended difficulty level",
      "rationale": "Why this activity now",
      "successMetrics": "How to measure progress"
    }
  ],
  "studyPlan": {
    "daily": ["Daily 10-15 minute activities"],
    "weekly": ["Weekly review and practice sessions"],
    "monthly": ["Monthly assessment and goal review"]
  },
  "skillBuilding": [
    {
      "skill": "Specific skill to develop",
      "currentLevel": "Where student is now",
      "targetLevel": "Where they should be",
      "pathway": ["Step-by-step skill development plan"],
      "resources": ["Recommended practice materials or activities"]
    }
  ],
  "motivationalBoosts": ["Strategies to maintain engagement and motivation"],
  "adaptiveAdjustments": "How to modify approach based on progress"
}
```

## 🎯 Contextual Prompt Examples

### For Elementary Students (K-5)
```
Create content appropriate for elementary students:
- Use simple, clear language
- Include visual descriptions and concrete examples
- Connect to familiar experiences and interests
- Keep questions short and focused
- Use encouraging, positive tone
- Include fun facts and interesting connections
- Avoid abstract concepts without concrete examples
```

### For Middle School Students (6-8)
```
Design content for middle school learners:
- Balance concrete and abstract thinking
- Include social and collaborative elements
- Connect to real-world applications
- Challenge thinking while providing support
- Include topics relevant to adolescent interests
- Encourage exploration and discovery
- Build critical thinking skills progressively
```

### For High School Students (9-12)
```
Develop content for high school students:
- Include complex analysis and synthesis
- Connect to career and college preparation
- Encourage independent thinking and research
- Include current events and contemporary issues
- Challenge assumptions and encourage debate
- Prepare for standardized assessments
- Build skills for lifelong learning
```

## 🔧 Technical Implementation Notes

### Prompt Engineering Best Practices
1. **Specificity**: Always include specific parameters and constraints
2. **Examples**: Provide clear examples of desired output format
3. **Context**: Include relevant background information
4. **Validation**: Request structured JSON for easy parsing
5. **Fallbacks**: Handle cases where AI generation fails
6. **Iteration**: Allow for prompt refinement based on results

### Error Handling
```javascript
// Example error handling for AI generation
try {
  const result = await generateWithGemini(prompt);
  const parsed = JSON.parse(result);
  return validateAndSanitize(parsed);
} catch (error) {
  console.error('AI generation failed:', error);
  return fallbackContent;
}
```

### Content Validation
- Check for appropriate content and language
- Validate JSON structure and required fields
- Ensure educational accuracy and quality
- Filter out potential bias or inappropriate content
- Verify difficulty level appropriateness