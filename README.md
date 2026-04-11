# 🍺 InterBrew - Master Your Interview Skills with AI

**Brew Your Skills. Ace Your Interviews.**

InterBrew is an intelligent interview preparation platform that combines AI-powered mock interviews, adaptive learning scenarios, and real-time performance analytics to help candidates master their interview skills.

---

## 🎯 Core Features

### 1. **AI-Powered Mock Interviews**
- Realistic, conversational interviews powered by Groq's advanced LLM
- Difficulty levels: Easy, Intermediate, Hard
- Speech-to-text enabled: Answer questions using your voice
- Adaptive questioning that adjusts difficulty based on your performance
- Multiple interview modes: Full interviews or problem-solving challenges
- Real-time conversation transcription and feedback

### 2. **Collections & Learning Paths**
- Curated topic collections across multiple domains (Software Engineering, System Design, Data Structures, etc.)
- Organized by difficulty levels
- Browse hundreds of interview questions
- Navigate through structured learning paths with related problems
- Each collection includes mock interview practice and detailed problem explanations

### 3. **Scenario-Based Practice**
- Real-world behavior interview scenarios (e.g., conflict resolution, decision-making situations)
- Guided learning modules for each scenario
- AI voice interviews that evaluate both technical AND soft skills
- Interactive lessons with explanations paired with interview practice

### 4. **Advanced Speech Analytics**
- **Hesitation Detection**: Identifies filler words (um, uh, like) for confident speaking
- **Pause Analysis**: Measures speaking rhythm and pacing
- **Interruption Counter**: Tracks active listening and turn-taking ability
- **Response Length Analysis**: Ensures detailed, thorough answers
- **Clarity Scoring**: Evaluates how well ideas are communicated

### 5. **Comprehensive Dashboard**
- **Readiness Assessment**: AI-generated interview readiness score (0-100) with personalized feedback
- **Progress Tracking**: Monitor completion of modules across collections and scenarios
- **Streak Counter**: Daily engagement tracking (gamification)
- **Statistics Overview**: 
  - XP points earned
  - Badges unlocked
  - Mock interviews completed
  - Leaderboard ranking

### 6. **Interactive Feedback System**
- Detailed performance reports after each interview
- Structured feedback highlighting:
  - **Strengths**: What you did well (focus, fluency, clarity)
  - **Areas for Improvement**: Specific recommendations for growth
  - **Soft Skills Scoring**: Rate your communication, listening, and confidence
  - **Overall Rating**: 1-5 star performance assessment

### 7. **Gamification & Engagement**
- **Leaderboard**: Compete with other users globally
- **XP System**: Earn points for completing interviews and modules
- **Badges**: Unlock achievements for milestones
- **Daily Streaks**: Build consistent practice habits
- **Favorite Questions**: Save challenging questions for later review

### 8. **Interview Scheduling**
- Schedule mock interviews for specific dates and times
- Get email reminders before your scheduled interview
- Organize interviews by topic and difficulty
- Maintain interview history for future reference

### 9. **User Authentication**
- Secure signup and login with Supabase
- Personalized user profiles
- Save all progress and preferences
- Cross-session data persistence

---

## 🏗️ Technical Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI components
- **AI Engine**: Groq SDK (Real-time LLM inference)
- **Database**: Supabase (PostgreSQL)
- **Speech Processing**: Web Speech API (browser-based speech-to-text and text-to-speech)
- **Graphics**: Three.js + Shader Gradient (animated landing page)
- **Email**: Resend (scheduled interview reminders)
- **Animations**: Framer Motion, Motion library

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database)
- Groq API key (for AI interviews)

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables Setup

Create two environment files in the root directory:

#### `.env.local` (Development environment)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key

# Optional: Email Service for Interview Reminders
RESEND_API_KEY=your_resend_api_key
```

#### `.env` (Production environment - optional)
```env
# Same variables as .env.local but with production values
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_supabase_anon_key
GROQ_API_KEY=your_prod_groq_api_key
RESEND_API_KEY=your_prod_resend_api_key
```

### Getting Your API Keys

1. **Supabase**:
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings → API to find your URL and Anon Key

2. **Groq**:
   - Sign up at [console.groq.com](https://console.groq.com)
   - Create an API key in your account settings

3. **Resend** (optional, for email reminders):
   - Sign up at [resend.com](https://resend.com)
   - Generate an API key from your dashboard

### Running the Application

```bash
# Development server (uses .env.local)
npm run dev

# Production build
npm run build

# Production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start practicing!

**Note**: The `.env` and `.env.local` files should **never** be committed to version control. Add them to `.gitignore` (already configured by default in Next.js projects).

---

## 📊 User Journey

1. **Sign Up** → Create account and set interview goals
2. **Explore Collections** → Browse interview topics and difficulty levels
3. **Practice Interviews** → Conduct AI-powered mock interviews
4. **Get Feedback** → Receive detailed performance analysis
5. **Learn Scenarios** → Practice behavioral interviews with guided lessons
6. **Track Progress** → Monitor improvement on personalized dashboard
7. **Compete** → Climb the leaderboard with consistent practice

---

## 💡 Key Differentiators

- ✅ **Real-time AI Interviews** - No delay, natural conversation flow
- ✅ **Multimodal Feedback** - Speech analysis + behavioral assessment + technical evaluation
- ✅ **Adaptive Difficulty** - Questions adjust based on your performance
- ✅ **Behavioral + Technical** - Not just problem-solving, soft skills too
- ✅ **Gamified Learning** - Streaks, XP, badges keep you motivated
- ✅ **Comprehensive Analytics** - Data-driven insights into your interview readiness

---

## 📦 Project Structure

```
app/
  ├── components/
  │   ├── mock_int/          # Mock interview component with speech I/O
  │   ├── collections/       # Topic browsing and selection
  │   ├── scenario/          # Behavioral scenario practice
  │   ├── dashboard/         # Analytics and progress tracking
  │   ├── leaderboard/       # Competitive ranking
  │   └── navigation/        # Global UI shell
  ├── (routing)/            # App pages
  │   ├── dashboard/
  │   ├── collections/
  │   ├── scenario-practice/
  │   ├── leaderboard/
  │   └── auth/
  ├── api/                  # Backend routes
  │   ├── mock_int/        # Interview generation
  │   ├── ai-report/       # Readiness assessment
  │   └── send-interview-reminder/
  └── lib/                 # Utilities
      ├── supabaseClient.js
      ├── streak.ts
      └── utils.ts
```

---

## 🎓 What Users Can Learn

- System design and software engineering fundamentals
- Data structures and algorithms interview patterns
- Behavioral interview techniques and soft skills
- Communication and presentation skills
- Confidence and fluency in technical discussions
- Time management under pressure

---

## 🏆 Perfect For Hackathon Judges

This project demonstrates:
- **Full-stack Development**: Next.js frontend + backend API integration
- **AI Integration**: Real-time Groq LLM for natural conversations
- **Database Design**: Complex user tracking and progress management
- **UX/UI Excellence**: Smooth animations, intuitive navigation, excellent feedback loops
- **Feature Completeness**: From MVP to advanced features (analytics, scheduling, gamification)
- **Production-Ready Code**: TypeScript, proper error handling, responsive design

---

## 📝 Build & Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

Deploy on Vercel for seamless Next.js hosting and edge functions.

---

**InterBrew**: Where interview prep meets intelligent AI coaching. 🚀
