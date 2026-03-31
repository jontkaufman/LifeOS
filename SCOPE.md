# LifeOS - Full Feature Scope

> A self-hosted AI-powered life coaching and personal development platform.
> Users download, configure their own API key, and run locally.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite + TypeScript | Fast dev, huge ecosystem, contributors know it |
| Styling | Tailwind CSS + shadcn/ui | Consistent dark theme, accessible components, rapid dev |
| Backend | Python 3.11+ / FastAPI | Best AI SDK ecosystem, async, auto-docs |
| Database | SQLite (via SQLAlchemy) | Zero config, single file, perfect for local |
| AI SDKs | anthropic, openai, ollama | Multi-provider support |
| Packaging | Docker + docker-compose + manual install | Flexible deployment |

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│         React Frontend (Vite)        │
│  SPA served as static files          │
└──────────────┬──────────────────────┘
               │ REST API + WebSocket (chat streaming)
┌──────────────▼──────────────────────┐
│       FastAPI Backend                │
│  ┌─────────┐ ┌──────────┐          │
│  │ AI Engine│ │ Search   │          │
│  │ (multi-  │ │ Engine   │          │
│  │ provider)│ │ (web)    │          │
│  └─────────┘ └──────────┘          │
│  ┌─────────────────────────┐        │
│  │  SQLite (all user data) │        │
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
```

Frontend is built to static files and served by FastAPI. Single process, single port.

---

## Feature Modules

### 1. Onboarding & Setup

**First-run wizard** that walks users through initial configuration:

- **API Key Setup**
  - Step-by-step instructions with screenshots for obtaining API keys
  - Support for: Anthropic Claude, OpenAI, Ollama (local models)
  - API key validation (test call) before saving
  - Keys stored locally in encrypted config file (never transmitted anywhere)
  - Link to each provider's API key page with cost estimates

- **Coaching Style Discovery (AI-guided)**
  - Interactive AI conversation to determine user's personality type
  - AI asks about: communication preferences, motivation style, response to criticism, energy sources, learning style
  - Based on responses, AI recommends coaching styles with explanations
  - User can accept recommendation, modify it, or pick their own
  - Can select any well-known person as a coaching persona (Tony Robbins, Dan Pena, Dwayne Johnson, Taylor Swift, Jocko Willink, Brene Brown, etc.)
  - Blended styles supported (e.g., "70% Tony Robbins energy + 30% Dan Pena accountability")
  - Coaching style is stored as a structured system prompt + personality parameters

- **Profile Basics**
  - Name, age, location (optional)
  - Life vision statement
  - Core values identification (AI-assisted brainstorming)
  - Current life context / situation summary

### 2. Personal Profile System

**Deep, evolving personal profile** that gives the AI rich context:

- **Identity & Values**
  - Name, preferred name/pronouns
  - Life vision / mission statement
  - Core values (ranked, with descriptions)
  - Personality type (MBTI, Enneagram, DISC, StrengthsFinder - optional, AI can help determine)
  - Communication preferences
  - Love languages, motivational drivers

- **Life Areas** (user-configurable, defaults provided)
  - Default areas: Career, Finances, Health & Fitness, Relationships, Personal Growth, Mental Health, Spirituality, Creativity, Education/Learning, Family
  - Users can add/remove/rename areas
  - Each area has:
    - Vision: "What does success look like?"
    - Current state: honest assessment
    - Importance rating (1-10)
    - Satisfaction rating (1-10)
    - Key relationships/stakeholders in this area
    - Notes

- **Life Context Timeline**
  - Major life events log (new job, move, relationship change, health event)
  - AI references these for context in coaching ("Since your career change in March...")
  - Optional date + category + notes per entry

- **Strengths & Growth Edges**
  - Self-identified strengths
  - Areas for improvement
  - AI-observed patterns (populated over time from reviews and chats)
  - Skills inventory

### 3. Coaching Style Engine

**Fully customizable AI coaching personality system:**

- **Preset Coaching Styles** (curated library)
  - Tony Robbins: High-energy, breakthrough-focused, incantations, state management
  - Brendan Burchard: High-performance habits, clarity, energy, courage
  - Dan Pena: Brutal honesty, no-excuses accountability, aggressive goal-setting
  - Jocko Willink: Discipline equals freedom, ownership mentality, direct
  - Brene Brown: Vulnerability-based, empathy-driven, wholehearted living
  - James Clear: Systems/habits-focused, atomic improvements, identity-based change
  - Simon Sinek: Purpose-driven, start with why, infinite mindset
  - David Goggins: Mental toughness, callusing the mind, savage accountability
  - Mel Robbins: Action-bias, 5-second rule, confidence building
  - Gary Vee: Hustle culture, patience + speed, self-awareness
  - (More added over time)

- **Custom Persona Builder**
  - Pick any well-known person (celebrity, coach, historical figure, fictional character)
  - AI generates a coaching style profile based on its knowledge of that person
  - Adjustable parameters:
    - Harshness level (1-10): gentle encouragement ↔ brutal honesty
    - Formality (1-10): casual friend ↔ professional mentor
    - Focus: emotional support vs tactical advice vs accountability
    - Communication style: questions vs directives vs stories/metaphors
    - Humor level: serious ↔ playful
    - Spirituality/woo factor: practical only ↔ spiritual integration
  - Custom system prompt editing (advanced users)

- **Blended Coaching**
  - Mix multiple styles with weighted percentages
  - Example: "50% Brene Brown empathy + 30% Jocko discipline + 20% James Clear systems"
  - AI dynamically adapts tone based on blend

- **Context-Adaptive Coaching**
  - Coach style can auto-adjust based on user's current mood/energy
  - If user is in crisis → more empathetic regardless of style
  - If user is coasting → style leans more into accountability
  - User can override: "Give it to me straight" / "Be gentle today"

### 4. Goal Management System

**Structured goal setting with AI coaching integration:**

- **Goal Creation**
  - Title, description, life area assignment
  - Goal type: outcome goal, process goal, identity goal
  - SMART goal formatting assistance (AI helps refine vague goals)
  - Target date (optional)
  - Priority level
  - Milestones / sub-goals
  - Success metrics (how will you measure this?)

- **Goal Organization**
  - Grouped by life area
  - Filter by: active, completed, paused, abandoned
  - Sort by: priority, deadline, area, date created
  - Status tracking: not started → in progress → completed / paused / abandoned
  - Progress percentage (manual or milestone-based)

- **Review Cadence** (per goal or per area)
  - Options: daily, weekly, biweekly, monthly, quarterly
  - Smart reminders at review time
  - Different areas can have different cadences
  - AI suggests review frequency based on goal type

- **Goal History**
  - Full history of status changes
  - Review scores over time
  - Completion celebrations
  - Abandoned goals tracked with reasons (learning opportunities)

### 5. Review & Check-in System

**Flexible, multi-cadence reflection system:**

- **Quick Daily Check-in** (optional, 2 min)
  - Energy level (1-10)
  - Mood (emoji or word selection)
  - Top 3 priorities for today
  - One thing grateful for
  - Yesterday's wins (brief)

- **Weekly Review** (structured, 15-20 min)
  - Week summary: wins, challenges, lessons
  - Score each active life area (1-10)
  - Goal progress updates
  - Energy and mood trends for the week
  - Next week priorities
  - AI coaching analysis (generated)
  - AI asks follow-up questions based on patterns

- **Monthly Reflection** (deep dive, 30 min)
  - Month-over-month trend analysis (AI-generated)
  - Life area satisfaction re-assessment
  - Goal progress review (are goals still relevant?)
  - Highlight reel: biggest wins
  - Growth edges: where did you struggle?
  - Adjust goals/priorities for next month
  - AI comprehensive coaching report

- **Quarterly Big-Picture Review**
  - Life vision alignment check
  - Major area assessments
  - Goal recalibration
  - 90-day planning
  - AI strategic coaching session

- **Review History & Trends**
  - Timeline view of all past reviews
  - Charts: area scores over time, mood trends, energy patterns
  - AI-detected patterns ("Your finances score drops after months where health score is low")
  - Searchable review archive

### 6. AI Coaching Chat

**The core interaction - conversational AI coaching:**

- **Chat Interface**
  - Clean, modern chat UI with markdown rendering
  - Streaming responses (real-time token display)
  - Chat history preserved (searchable)
  - Multiple conversation threads

- **Chat Modes** (optional focus selectors)
  - **Open coaching**: General life coaching, whatever's on your mind
  - **Goal review**: Focused on specific goal progress and strategy
  - **Quick check-in**: Brief motivational touch-base
  - **Deep session**: Extended coaching conversation, deeper exploration
  - **Crisis/motivation**: When you're struggling and need a boost
  - **Accountability check**: "Did you do what you said you'd do?"
  - **Brainstorming**: Exploring new ideas, possibilities, decisions
  - **Celebration**: Acknowledging wins and progress

- **Context Injection**
  - AI automatically receives relevant context:
    - User profile, values, vision
    - Active coaching style
    - Relevant goals and recent progress
    - Latest review scores and trends
    - Recent journal entries (if journaling enabled)
    - Habit data (if habit tracking enabled)
    - Life events timeline
    - Conversation history
  - Context is intelligently pruned to stay within token limits
  - User can see what context is being sent (transparency)

- **Conversation Features**
  - Pin important messages/insights
  - AI-generated session summaries
  - Action items extracted from conversations
  - Follow-up reminders from coaching sessions
  - Export conversations

### 7. Journal System

**Free-form journaling with AI-powered insights:**

- **Journal Entries**
  - Rich text editor (markdown)
  - Date/time stamped
  - Optional: mood tag, energy level, life area tags
  - Prompt suggestions (AI-generated based on current goals/reviews)
  - Voice-to-text support (browser native)

- **AI Journal Analysis**
  - Sentiment/mood tracking over time
  - Theme and pattern detection
  - AI can reference journal entries in coaching ("In your journal last week, you mentioned feeling overwhelmed by...")
  - Weekly/monthly journal summaries (AI-generated)
  - Gratitude pattern tracking

- **Journal Prompts Library**
  - Curated prompts organized by category
  - AI-generated personalized prompts based on current life context
  - Prompts tied to coaching style (Dan Pena prompt vs Brene Brown prompt = very different)

### 8. Habit Tracking (Optional Module)

**Daily habit tracking that feeds into coaching context:**

- **Habit Management**
  - Create habits linked to life areas and goals
  - Frequency: daily, specific days, X times per week
  - Habit stacking / time-of-day assignment
  - Category/area tagging

- **Tracking Interface**
  - Simple daily check-off (checkbox or swipe)
  - Today view: all habits for today
  - Quick entry - minimal friction

- **Habit Analytics**
  - Streak tracking (current + longest)
  - Completion rate (daily, weekly, monthly)
  - Heat map calendar view
  - Correlation with mood/energy/review scores

- **AI Integration**
  - AI references habit data in coaching sessions
  - Pattern detection: "You tend to skip workouts on days you journal about stress"
  - Habit suggestions based on goals
  - Accountability in coaching: "You've completed meditation 3/7 days this week"

### 9. Sources & Reference Library

**Curated knowledge base for coaching philosophies and inspiration:**

- **Source Types**
  - Books (title, author, key takeaways)
  - Podcasts / episodes
  - Articles / blog posts
  - Courses / programs
  - People / coaches / mentors
  - Quotes / mantras
  - Videos / talks

- **Adding Sources**
  - Manual entry (title, type, notes, key takeaways)
  - Web search integration: AI searches for coaching philosophies, book summaries, methodologies
  - AI-generated summaries: "Tell me about Atomic Habits" → AI generates structured summary
  - URL import: paste a link, AI extracts key content
  - Tag sources with life areas and topics

- **Source Integration with Coaching**
  - AI can reference relevant sources during coaching
  - "As James Clear writes in Atomic Habits, you don't rise to the level of your goals..."
  - Source-based coaching: "Coach me using the principles from [source]"
  - Reading/watching list management

### 10. Dashboard & Analytics

**At-a-glance view of your life operating system:**

- **Dashboard Widgets**
  - Welcome message with coaching style greeting
  - Life area radar/spider chart (current satisfaction scores)
  - Active goals progress summary
  - Current streaks (habits)
  - Upcoming reviews due
  - Mood/energy trend (last 30 days)
  - Recent AI insights/observations
  - Quick actions: start chat, quick check-in, log habit

- **Analytics Views**
  - Life area scores over time (line charts)
  - Goal completion rates
  - Habit streak calendar
  - Mood and energy trends
  - Correlation insights (AI-detected)
  - Journal frequency and themes
  - Coaching session frequency

- **AI Insights Panel**
  - AI-generated observations updated periodically
  - Pattern recognition across all data
  - Suggested focus areas
  - Celebration of progress
  - Gentle nudges for neglected areas

### 11. Data Management

**User owns all their data:**

- **Local Storage**
  - SQLite database file (single file, easy to backup)
  - API keys in local encrypted config
  - All data stays on user's machine

- **Export/Import**
  - Full data export as JSON
  - Selective export (just goals, just journals, etc.)
  - Import from backup (full restore)
  - Data format documented for interoperability

- **Privacy**
  - No telemetry, no analytics, no phone-home
  - API calls go directly to AI provider (no intermediary)
  - Users can audit all API calls (log viewer)
  - Clear documentation on what data is sent to AI providers

### 12. Settings & Configuration

- **AI Provider Settings**
  - API key management (add, test, remove)
  - Provider selection (Anthropic, OpenAI, Ollama)
  - Model selection per provider
  - Token/cost tracking (estimated spend)
  - Temperature and other model parameters (advanced)

- **Coaching Settings**
  - Active coaching style selection
  - Style editor and blending
  - Coaching style discovery (re-run anytime)
  - Context window preferences (how much history to include)

- **Notification/Reminder Settings**
  - Review reminders (browser notifications)
  - Cadence configuration per area
  - Quiet hours

- **Appearance**
  - Dark/light theme (dark default)
  - Accent color customization
  - Font size
  - Compact/comfortable density

- **About / Help**
  - Version info
  - Setup guide
  - API key instructions
  - Link to GitHub repo

---

## Data Model (High-Level)

```
User Profile
├── Identity (name, vision, values, personality)
├── Life Areas[] (configurable)
│   ├── name, icon, color
│   ├── vision, current_state
│   ├── importance, satisfaction
│   └── review_cadence
├── Life Events[] (timeline)
└── Strengths & Growth Edges

Coaching Config
├── Active Style
├── Preset Styles[]
├── Custom Styles[]
│   ├── name, description
│   ├── base_person (optional)
│   ├── parameters (harshness, formality, etc.)
│   └── system_prompt
└── Blend Config

Goals
├── goal_id, title, description
├── life_area, type, priority
├── status, progress
├── target_date
├── milestones[]
├── review_cadence
└── history[]

Reviews
├── review_id, type (daily/weekly/monthly/quarterly)
├── date, week_id
├── area_scores{}
├── reflections (wins, challenges, lessons)
├── mood, energy
├── ai_analysis
└── action_items[]

Chat
├── conversation_id, mode, date
├── messages[] (role, content, timestamp)
├── pinned_messages[]
├── summary
└── action_items[]

Journal
├── entry_id, date
├── content (markdown)
├── mood, energy, tags[]
├── ai_analysis
└── life_area_tags[]

Habits
├── habit_id, name
├── life_area, linked_goal
├── frequency, schedule
├── completions[] (date, done)
└── streak_data

Sources
├── source_id, type
├── title, author, url
├── summary, key_takeaways
├── tags[], life_areas[]
└── ai_generated (bool)

Settings
├── api_keys{} (encrypted)
├── active_provider, model
├── theme, appearance
├── notification_prefs
└── advanced_ai_params
```

---

## Pages / Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Life overview, widgets, quick actions |
| `/onboarding` | First-run Wizard | API setup, style discovery, profile basics |
| `/profile` | Personal Profile | Identity, values, life areas, timeline |
| `/goals` | Goal Management | All goals, CRUD, progress, milestones |
| `/reviews` | Reviews | Check-ins, weekly/monthly reviews, history |
| `/chat` | AI Coaching Chat | Conversational coaching interface |
| `/journal` | Journal | Free-form entries, prompts, AI analysis |
| `/habits` | Habit Tracker | Daily habits, streaks, analytics |
| `/sources` | Reference Library | Books, coaches, articles, web search |
| `/analytics` | Analytics | Charts, trends, AI insights |
| `/settings` | Settings | API keys, coaching style, appearance |

---

## Deployment Options

### Option 1: Manual Install
```bash
git clone https://github.com/[user]/lifeos.git
cd lifeos
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
python main.py
# → Open http://localhost:8080
```

### Option 2: Docker
```bash
git clone https://github.com/[user]/lifeos.git
cd lifeos
docker-compose up
# → Open http://localhost:8080
```

### Option 3: One-line Script
```bash
curl -fsSL https://raw.githubusercontent.com/[user]/lifeos/main/install.sh | bash
```

---

## MVP vs Future Features

### Phase 1 - MVP (Build Now)
- [x] Onboarding wizard (API key + profile basics)
- [x] Coaching style discovery & preset library
- [x] Personal profile (identity, life areas)
- [x] Goal management (CRUD, areas, progress)
- [x] AI coaching chat (streaming, modes, full context)
- [x] Weekly review system
- [x] Dashboard with key metrics
- [x] Settings (API keys, provider selection, coaching style)
- [x] Data export/import
- [x] Docker + manual install

### Phase 2 - Enhanced
- [ ] Journal system with AI analysis
- [ ] Habit tracking module
- [ ] Daily check-ins
- [ ] Monthly and quarterly reviews
- [ ] Sources/reference library with web search
- [ ] Advanced analytics and charts
- [ ] AI insights panel
- [ ] Custom coaching persona builder (full parameter editor)
- [ ] Blended coaching styles

### Phase 3 - Polish
- [ ] Light theme
- [ ] Mobile-responsive optimization
- [ ] Voice input for journal/chat
- [ ] Conversation pinning and summaries
- [ ] Life events timeline
- [ ] Personality assessment integration
- [ ] Cost/token tracking
- [ ] API call audit log

---

## Additional Value-Add Features Identified

These are features not explicitly requested but would significantly strengthen the long-term value proposition:

1. **Morning/Evening Rituals** - Guided start/end of day routines that adapt based on coaching style and current goals
2. **Decision Framework** - When facing big life decisions, a structured AI-guided decision analysis using the user's values and goals as the lens
3. **Accountability Contracts** - User writes commitment to themselves, AI tracks and follows up
4. **Progress Letters** - AI writes "letter from future you" or "monthly progress report" in coaching style
5. **Challenge Mode** - 30/60/90 day focused challenges on specific areas with daily AI check-ins
6. **Affirmations/Mantras** - Generated based on goals and coaching style, shown on dashboard
7. **Weekly Email Digest** - Optional self-sent email summary (requires SMTP config)
8. **Vision Board** - Text-based vision board pulling from goals, values, and aspirations
9. **Coaching Session Prep** - AI generates a "session agenda" before deep coaching conversations based on recent data
10. **Emergency Reset Button** - When everything feels overwhelming, a guided "let's simplify and refocus" flow

---

*This document defines the full scope for LifeOS. Phase 1 (MVP) is the build target.*
