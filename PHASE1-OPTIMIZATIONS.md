# LifeOS Phase 1 - Optimization Proposals

> Based on analysis of 20+ leading coaching frameworks and gap analysis of the current SCOPE.md.
> Review each section. Nothing gets built until you approve.

---

## OPTIMIZATION 1: Structured Coaching Style Discovery (Onboarding)

**Current plan:** AI freestyles questions about communication preferences, motivation style, etc.

**Problem:** Without a structured backbone, every user gets a different quality of onboarding depending on what the AI happens to ask. This is the foundation of the entire coaching experience - it can't be random.

**Proposed change:** Replace with a **12-question structured assessment** using AI-natural conversation as the delivery mechanism. The AI asks these questions conversationally (not as a form), but the questions themselves are deterministic:

**Assessment Dimensions:**

| Dimension | Questions | Maps To | Source Framework |
|-----------|-----------|---------|-----------------|
| Accountability Type | 4 questions | Harshness, accountability style | Gretchen Rubin's Four Tendencies (Upholder/Questioner/Obliger/Rebel) |
| Motivational Direction | 2 questions | Coach persona selection | Toward-reward vs away-from-pain orientation |
| Processing Style | 2-3 questions | Communication style, depth | Concrete vs abstract, feeling vs thinking |
| Emotional Regulation | 2 questions | Crisis mode behavior, support vs solutions | Empathy-first vs solutions-first preference |
| Readiness for Change | 1-2 questions | Coaching intensity, pacing | Transtheoretical Model (Stages of Change) |
| Spiritual/Philosophical | 1 question | Spirituality parameter, coach matching | Secular practical vs spiritual integration |

**Sample questions (AI delivers conversationally):**
- "When you set a goal and nobody's watching, what typically happens - do you follow through, or does it fade?"
- "Think of a time you made a major life change. Were you running toward something exciting, or away from something painful?"
- "When you're having a terrible day and you tell someone about it, what helps most - someone who listens and validates, someone who problem-solves, or someone who gives you a kick in the pants?"
- "How would you describe where you are right now - thinking about changes, actively making them, or maintaining progress?"

**Result:** Stored as structured data (Four Tendencies type, motivational orientation, processing style, etc.) - NOT just a coaching style recommendation. This data improves coaching quality over time as the AI learns more about the user.

**Impact:** High. This is the difference between "generic AI chatbot" and "AI that actually understands how to coach ME."

---

## OPTIMIZATION 2: Fix Life Areas (Reduce Overlap, Add Missing)

**Current plan:** 10 default areas: Career, Finances, Health & Fitness, Relationships, Personal Growth, Mental Health, Spirituality, Creativity, Education/Learning, Family

**Problems identified:**
- "Relationships" and "Family" overlap significantly for most users
- "Mental Health" and "Health & Fitness" should be unified (coaches treat physical and mental health as one system)
- "Spirituality" as a default alienates secular users
- "Creativity" is niche - not universal enough for a default
- **Missing: Fun/Recreation** - present in nearly every validated Wheel of Life assessment. High achievers who use apps like this are exactly the ones who neglect play.
- **Missing: Purpose/Contribution** - captures legacy, giving back, mission - the dimension that Robbins, Sinek, and Shetty all emphasize

**Proposed 8 default areas** (still fully customizable - users add/remove/rename):

| # | Area | Covers | Color |
|---|------|--------|-------|
| 1 | Career & Work | Job, business, professional development, side projects | Gold |
| 2 | Finances | Income, savings, debt, investments, financial freedom | Teal |
| 3 | Health | Physical fitness, mental health, nutrition, sleep, energy | Red |
| 4 | Relationships & Social | Friends, community, networking, social life | Pink |
| 5 | Family & Home | Partner/spouse, children, parents, living environment | Orange |
| 6 | Personal Growth & Learning | Skills, education, self-improvement, reading, mindset | Purple |
| 7 | Fun & Recreation | Hobbies, adventure, play, rest, travel, entertainment | Blue |
| 8 | Purpose & Contribution | Mission, giving back, legacy, creative expression, impact | Green |

**Why 8 instead of 10:** Fewer areas = users actually fill them all out. 10 creates form fatigue. 8 is the standard Wheel of Life count used by most professional coaches. Users who want Spirituality, Creativity, or Mental Health as separate areas can add them.

**Impact:** Medium. Reduces onboarding friction, removes confusion, covers the actual dimensions coaches assess.

---

## OPTIMIZATION 3: Add Importance + Satisfaction Scores Per Area (Wheel of Life)

**Current plan:** Each area has "vision" and "current state" as text fields.

**Problem:** Text is great for context but gives the AI nothing quantitative to work with. The **Wheel of Life** exercise - used by virtually every professional coach on earth - works because the gap between importance and satisfaction reveals where coaching should focus. This is the single most universal coaching tool and it's missing.

**Proposed addition:** Add two sliders per life area in the Profile:
- **Importance** (1-10): "How important is this area to you right now?"
- **Satisfaction** (1-10): "How satisfied are you with this area right now?"

**What this enables:**
- Dashboard shows a radar/spider chart with importance as the outer ring and satisfaction as the filled area - gaps are immediately visible
- AI automatically prioritizes coaching around the biggest importance-satisfaction gaps
- "Your biggest gap is Health: importance 9, satisfaction 3. Let's talk about that."
- Weekly reviews show last week's satisfaction next to the current slider for trend awareness
- The system gets smarter about what to focus on without the user having to tell it

**Every coach does this:** Robbins (Life Mastery), Burchard (Life Assessment), Ziglar (Wheel of Life), Ferriss (Dreamlining), Shetty (Dharma Discovery). It's universal because it works.

**Impact:** High. This is the data engine that drives intelligent coaching prioritization.

---

## OPTIMIZATION 4: Expand Coaching Style Parameters

**Current plan:** 6 parameters - harshness, formality, focus (single toggle), communication style, humor, spirituality.

**Problems:**
- "Focus" as a single toggle between emotional support / tactical advice / accountability forces a false choice. Users often want high empathy AND high accountability (like a tough but caring parent).
- Missing dimensions that materially change the coaching experience.

**Proposed parameter set (10 dimensions):**

| Parameter | Scale | What It Controls |
|-----------|-------|-----------------|
| Challenge vs Support | 1-10 (support ↔ challenge) | How much the coach pushes vs nurtures. The most studied dimension in coaching research. |
| Tactical Specificity | 1-10 (big picture ↔ step-by-step) | Does the coach give concrete action steps or help you find your own? |
| Emotional Depth | 1-10 (surface/practical ↔ root-cause) | "Just do it" vs "Why do you think you procrastinate?" |
| Accountability Intensity | 1-10 (gentle ↔ relentless) | How hard the coach follows up on commitments |
| Formality | 1-10 (casual friend ↔ professional mentor) | Tone and language register |
| Humor | 1-10 (serious ↔ playful) | Use of jokes, banter, lightness |
| Pace | 1-10 (patient ↔ urgent) | Robbins and Pena are both intense but have very different pacing |
| Spirituality | 1-10 (purely practical ↔ spiritual) | Manifestation, meditation, purpose vs pure pragmatism |
| Communication Style | Choice: questions / directives / stories-metaphors / mixed | How the coach primarily communicates |
| Time Orientation | Choice: past-reflection / present-awareness / future-planning / balanced | Where the coach directs attention |

**Why this matters:** With 6 parameters you can't distinguish between Dan Pena and Jocko Willink (both "harsh"). With 10, you can:
- Pena: Challenge 10, Tactical 8, Depth 3, Accountability 10, Formality 4, Humor 2, Pace 10, Spirituality 1
- Jocko: Challenge 9, Tactical 7, Depth 6, Accountability 9, Formality 5, Humor 3, Pace 7, Spirituality 2
- Brene Brown: Challenge 6, Tactical 4, Depth 10, Accountability 5, Formality 5, Humor 6, Pace 3, Spirituality 6
- The Rock: Challenge 7, Tactical 6, Depth 4, Accountability 7, Formality 2, Humor 8, Pace 6, Spirituality 3

**Users never see these sliders during onboarding** - the discovery flow sets them automatically. Advanced users can tweak them in settings.

**Impact:** High. This is the difference between "AI talks in Tony Robbins style" and "AI coaches like Tony Robbins would actually coach."

---

## OPTIMIZATION 5: Goal Structure - Add Purpose/Why and Commitment Score

**Current plan:** Title, description, type, SMART assistance, target date, priority, milestones, metrics.

**What's missing from proven frameworks:**

**A. Purpose/Why field (from Tony Robbins' RPM system)**
RPM = Results, Purpose, Massive Action Plan. The "P" is the most important part - the emotional reason behind the goal. Goals without emotional fuel don't get completed.

Add: `purpose_why` field - "Why does this goal matter to you? What will achieving it mean for your life?"

The AI should probe this during goal creation: "That's a great goal. But tell me - why does this actually matter to you? Not the logical reason, the emotional one."

**B. Identity Statement (from James Clear's Atomic Habits)**
For identity-based goals, add: `identity_statement` - "I am the type of person who..."

Example: Goal = "Run 3x per week" → Identity = "I am a runner." Clear's research shows identity-based framing dramatically increases follow-through.

**C. Commitment Score (standard coaching intake)**
Add: `commitment_level` (1-10) at goal creation.

Every professional coach asks: "On a scale of 1-10, how committed are you to this?" If the answer is below 7, the coach explores why before proceeding. The AI should do the same:
- Score 8-10: "Great, let's build your action plan."
- Score 5-7: "I notice you're not fully committed. What's holding you back? Let's talk about that before we plan."
- Score 1-4: "It sounds like this might not be the right goal right now. What would make it a 10?"

Re-assessed at each review cycle.

**D. Effort Estimation**
Add: `estimated_weekly_hours` - rough time commitment.

This enables the AI to flag when a user has 60 hours of weekly goals and 168 hours in a week. "You've committed to roughly 45 hours/week of goal-related activities on top of your day job. Let's talk about what's realistic."

**Impact:** High. Transforms goals from a checkbox list into a coached goal-setting experience.

---

## OPTIMIZATION 6: Weekly Review - Add High-Impact Questions

**Current plan:** Wins, challenges, lessons, area scores, energy, mood, next week priorities, AI analysis.

**Missing questions from proven frameworks:**

| Question | Source | Why It Matters |
|----------|--------|---------------|
| "What am I avoiding or procrastinating on?" | Stoic journaling (Holiday/Ferriss) | The single most powerful coaching question. Surfaces avoidance patterns that block all progress. |
| "What gave me energy? What drained me?" | Burchard High Performance Planner | Qualitative complement to the energy slider. Reveals environmental and relational energy patterns. |
| "What commitments from last week did I not fulfill?" | GTD Weekly Review (David Allen) | Specific accountability. Different from "challenges" - this is "I said I would and I didn't." |
| "What would I do differently?" | Stoic evening review | Forces behavioral change, not just observation. |
| "3 things I'm grateful for" | Positive psychology / Robbins Priming | Research-backed mood and perspective improver. Should be in weekly review, not just optional daily. |
| "Alignment score: How aligned were my actions with my values/goals?" (1-10) | Standard coaching metric | Measures integrity - walking the talk vs drifting. |
| "Stress level" (1-10) | Distinct from mood and energy | You can be high-energy, positive-mood, AND highly stressed. Chronic stress patterns are critical to track. |
| "What support do I need from my coach right now?" | Coaching best practice | Options: accountability, encouragement, strategy, someone to listen, a challenge. Directly feeds next AI session. |

**Proposed review structure (reorganized):**

1. **Gratitude** (3 items) - Start positive, primes the brain
2. **Wins** - What went well?
3. **Challenges** - What was hard?
4. **Avoidance** - What am I avoiding? (NEW)
5. **Unfulfilled commitments** - What did I say I'd do but didn't? (NEW)
6. **Lessons & what I'd do differently** - Combined
7. **Energy sources & drains** - What gave/took energy? (NEW, qualitative)
8. **Area scores** (1-10 each) - Show last week's score next to slider
9. **Overall scores** - Life satisfaction, alignment, stress (NEW)
10. **Mood & energy level** - Existing sliders
11. **Next week priorities** - Top 3-5
12. **Support needed** - What kind of coaching do I need right now? (NEW)
13. **AI Coach Analysis** - Generated after submission

**Impact:** High. These are the questions that make the difference between "form filling" and "genuine self-reflection." The avoidance question alone is worth more than most others.

---

## OPTIMIZATION 7: Chat Session Protocols (Opening & Closing)

**Current plan:** 8 chat modes defined but no specification for how sessions begin or end.

**Problem:** Professional coaches never wing session structure. The opening sets the frame, the closing creates accountability. Without protocols, the AI just says "How can I help today?" every time.

**Proposed session opening protocols:**

| Mode | Opening Behavior |
|------|-----------------|
| Open Coaching | "What's most alive for you right now?" or personalized based on recent data |
| Goal Review | AI summarizes goal state: "Let's look at [goal]. You're at [progress]. Last review you scored [area] at [X]. What's changed?" |
| Quick Check-in | "Hey [name]. Quick pulse check - how are you feeling right now, 1 word?" |
| Deep Session | "Before we dive in, take a breath. [Pause.] Now - what's the thing you most need to explore today?" |
| Crisis/Motivation | Immediate empathy and grounding, NOT questions. "I'm here. Whatever you're going through, you don't have to figure it out alone. Tell me what's happening." |
| Accountability | "Last time we talked, you committed to [X, Y, Z]. Let's check in on each one." |
| Brainstorming | "Let's explore. No judgment, no commitments yet. What possibilities are you considering?" |
| Celebration | "I saw your progress this week and I want to acknowledge it before we do anything else. [Specific wins from data.]" |
| Decision Making | "Walk me through the decision you're facing. What are the options as you see them?" (NEW MODE) |
| Reflection | "Something happened and you want to think it through. I'm here to ask the right questions, not give answers. What's on your mind?" (NEW MODE) |

**Proposed session closing protocol (all modes):**
1. AI summarizes key insights from the conversation
2. AI extracts specific commitments/action items
3. AI asks: "When will you do this by?"
4. AI acknowledges the user's work: "You showed real [courage/honesty/commitment] today."
5. Action items saved and surfaced on dashboard

**Impact:** High. This is what makes the AI feel like a coach instead of a chatbot. The accountability loop (dashboard showing commitments from last session) is the killer feature.

---

## OPTIMIZATION 8: Add 2 Missing Chat Modes

**Current plan:** 8 modes (Open, Goal Review, Check-in, Deep, Crisis, Accountability, Brainstorming, Celebration)

**Missing modes identified:**

**A. Decision Making Mode**
One of the top 3 reasons people seek coaching. Different from brainstorming (divergent) - this is convergent, weighing options against the user's values and goals.

The AI should:
- Pull in user's values and relevant goals as the decision lens
- Use a structured decision framework (pros/cons weighted by values)
- Surface potential conflicts with existing goals
- Ask: "Which option is most aligned with who you want to become?"
- Not make the decision - help the user see clearly

**B. Reflection/Processing Mode**
"Something happened and I need to process it." Not crisis-level, but the user wants to think through an experience. More Socratic - AI asks questions rather than giving advice.

The AI should:
- Listen more, direct less
- Ask deepening questions: "What did that bring up for you?" "What does that remind you of?"
- Help the user connect the experience to their values and patterns
- Suggest journaling after the conversation

**Impact:** Medium. Completes the coaching conversation type coverage. Without Decision Making mode, users will try to use Open Coaching for decisions and get a less focused experience.

---

## OPTIMIZATION 9: Dashboard - Lead with Coaching, Not Metrics

**Current plan:** Welcome message, radar chart, goal progress, streaks, mood trends, AI insights, quick actions.

**Problem:** The dashboard is designed like an analytics tool. Coaches lead with the person, not the numbers.

**Proposed changes:**

**A. AI Coaching Message as the primary dashboard element**
Not a generic welcome. A personalized, coaching-style-aware message generated from recent data:
- Tony Robbins style: "Jonathan! You crushed your Career goals last week and your energy is UP. But Health dropped to a 4. Your body is the vehicle for everything else - let's make that the focus this week. You ready?"
- James Clear style: "Good morning. Small observation: you've completed your meditation habit 6 of the last 7 days. That's identity-level change happening. The one area to watch - you've been avoiding the finance conversation for 3 weeks now."
- Dan Pena style: "Your review says Career is a 7. A 7 is mediocre. You told me your vision was to build a business that changes lives. Does a 7 get you there? Didn't think so. Get in the chat."

This message updates when the user opens the dashboard (cached, regenerated periodically or after reviews).

**B. Importance vs Satisfaction gap chart** (requires Optimization 3)
Spider/radar chart showing both dimensions - the visual gap is immediately actionable.

**C. Commitments from last coaching session**
Action items extracted from the most recent chat, displayed with checkboxes. This closes the accountability loop.

**D. "Days since last review" indicator**
If it's Thursday and the weekly review isn't done, surface it prominently. Coaching styles affect the tone: gentle nudge (Brene Brown style) vs "You're falling behind" (Pena style).

**Impact:** Medium-High. The personalized coaching message is what makes users open the app daily. Metrics alone don't create that pull.

---

## OPTIMIZATION 10: Crisis Detection & Mental Health Safety

**Current plan:** Brief mention: "If user is in crisis, more empathetic regardless of style."

**Problem:** No specification for HOW crisis is detected. This isn't just a feature - it's an ethical requirement for any AI system that discusses personal struggles, mental health, and life challenges.

**Proposed implementation:**

**Detection triggers:**
- Keyword patterns in chat (suicidal ideation, self-harm, extreme distress language)
- Rapid score drops in reviews (any area dropping 4+ points in a single week)
- Mood selection of "terrible" combined with energy below 3
- User explicitly saying they're in crisis

**Response protocol:**
1. Immediately switch to empathetic mode regardless of coaching style (Dan Pena becomes supportive)
2. Acknowledge the severity: "What you're feeling is real and it matters."
3. Surface resources: Crisis hotline numbers (988 Suicide & Crisis Lifeline, Crisis Text Line)
4. Display persistent banner: "AI coaching is not a substitute for professional mental health support"
5. Offer to help find local therapists/counselors
6. Log the event (locally) so the AI has context in future sessions

**This should be a subtle, non-patronizing system.** Not every mention of "stressed" triggers it. The threshold should be calibrated to serious distress signals.

**Impact:** Critical. Not a "nice to have." Any responsible AI coaching system must have this. It also protects you legally if you distribute the software.

---

## OPTIMIZATION 11: Profile - Add Critical Coaching Intake Fields

**Current plan:** Name, vision, values, context, life areas with vision/state.

**What every professional coach asks in intake that we're missing:**

| Field | Why | How AI Uses It |
|-------|-----|---------------|
| Biggest current stressor | Standard intake question | AI prioritizes this in early sessions |
| Past coaching/therapy experience | What worked? What didn't? | AI avoids approaches that failed before |
| Support system | Who do they rely on? Are they isolated? | Affects social accountability recommendations |
| Sleep quality | 1-10 + typical hours | Foundational to every other area. A coach who doesn't ask about sleep is a bad coach |
| Exercise frequency | Times per week | Baseline for health coaching |
| Energy patterns | Morning person vs night owl, energy peaks/valleys | AI adapts coaching session recommendations to peak times |
| Stage of change | Contemplating, preparing, acting, maintaining | Dramatically changes coaching approach |

**These go in an optional "Coach's Intake" section of the profile.** Not required, but the AI prompts for them naturally in early coaching conversations if unfilled.

**Impact:** Medium. More context = better coaching. The sleep and energy pattern questions alone significantly improve coaching quality.

---

## OPTIMIZATION 12: Coaching Notes - AI Memory That Compounds

**Current plan:** Mentions "AI-observed patterns" in profile but no mechanism defined.

**Problem:** Without persistent coaching notes, every session starts from scratch context. Real coaches keep session notes. The AI should too.

**Proposed implementation:**

After each coaching conversation and weekly review, the AI generates and stores:
- **Observed patterns**: "User consistently avoids discussing finances" / "Energy drops correlate with weeks where exercise habit is below 50%"
- **Breakthroughs**: "User had a realization about their relationship with authority figures on 2026-03-15"
- **Recurring themes**: "Work-life balance comes up in 70% of sessions"
- **Risk areas**: "User tends to overcommit and then feel guilty about not following through"
- **Effective approaches**: "Metaphors work well with this user" / "Direct accountability produces better results than gentle suggestions"

Stored in a `coaching_notes` table. Injected into AI context as a compressed summary. Updated over time. The user can view and edit these notes (transparency).

**This is what makes LifeOS a long-term tool, not a disposable chatbot.** After 3 months of use, the AI knows: your patterns, what motivates you, what you avoid, what approaches work, and what's changed. That compounding context is the moat.

**Impact:** Very High. This is the #1 differentiator between "ChatGPT with a coaching prompt" and "a system that actually coaches you over time."

---

## OPTIMIZATION 13: Data Seeding - Immediate Value After Onboarding

**Current plan:** User fills out onboarding, then arrives at an empty dashboard.

**Problem:** Empty-app syndrome. The user just spent 10-15 minutes in onboarding and now sees blank pages. Momentum dies.

**Proposed post-onboarding actions:**

1. **AI generates 3-5 suggested goals** based on the profile (user can accept, modify, or dismiss)
2. **AI generates a "First Session Agenda"** shown on the dashboard: "Based on your profile, here's what I'd like to explore in our first coaching session: [list]"
3. **AI pre-populates the first coaching message** instead of waiting for the user to start: "Welcome to LifeOS, [name]. I've read your profile and I'm already noticing some things I want to explore with you. Ready to dive in?"
4. **Importance/satisfaction chart is immediately populated** from onboarding data - the user sees their first visual insight right away

**Impact:** Medium-High. The difference between "now what?" and "this thing already understands me." Critical for retention.

---

## SUMMARY: Priority-Ordered Optimization List

| # | Optimization | Module | Impact | Complexity |
|---|-------------|--------|--------|------------|
| 1 | Structured coaching discovery (12 questions) | Onboarding | High | Medium |
| 2 | Fix life areas (8 defaults, remove overlap) | Profile | Medium | Low |
| 3 | Importance + satisfaction scores (Wheel of Life) | Profile | High | Low |
| 4 | Expand coaching parameters (10 dimensions) | Coaching Engine | High | Medium |
| 5 | Goal purpose/why + commitment score | Goals | High | Low |
| 6 | High-impact review questions | Reviews | High | Low |
| 7 | Chat session opening/closing protocols | Chat | High | Medium |
| 8 | Add Decision Making + Reflection modes | Chat | Medium | Low |
| 9 | Dashboard leads with coaching message | Dashboard | Medium-High | Medium |
| 10 | Crisis detection & mental health safety | Cross-cutting | Critical | Medium |
| 11 | Coaching intake profile fields | Profile | Medium | Low |
| 12 | AI coaching notes (compounding memory) | Cross-cutting | Very High | Medium |
| 13 | Data seeding after onboarding | Onboarding | Medium-High | Medium |

---

## Coaching Frameworks Referenced

These are the specific systems from leading coaches that informed these optimizations:

| Coach | Framework | What We Borrowed |
|-------|-----------|-----------------|
| Tony Robbins | RPM (Results-Purpose-Massive Action), Priming, 6 Human Needs, Hour of Power | Purpose/why in goals, emotional state management, morning activation |
| Brendan Burchard | High Performance Habits (Clarity, Energy, Necessity, Productivity, Influence, Courage), HP Planner | Energy sources/drains question, clarity check, high-performance scoring |
| Dan Pena | QLA (Quantum Leap Advantage), "Just f*cking do it" | Brutal accountability mode, no-excuses follow-up, high pace parameter |
| James Clear | 4 Laws of Behavior Change, Identity-Based Habits, Habit Stacking | Identity statements in goals, systems over goals framing, 1% improvement |
| Jocko Willink | Extreme Ownership, Discipline Equals Freedom | Ownership-based accountability, discipline as the meta-habit |
| Brene Brown | Daring Greatly, Rising Strong, Wholehearted Living | Emotional depth parameter, vulnerability in coaching, shame resilience |
| David Goggins | Accountability Mirror, Cookie Jar, Callusing the Mind, 40% Rule | Challenge intensity, pushing past comfort, referencing past wins (cookie jar) |
| Mel Robbins | 5 Second Rule, High 5 Habit, Let Them Theory | Action-bias in coaching, confidence building, letting go of control |
| Simon Sinek | Start With Why, Infinite Game, Golden Circle | Purpose/contribution life area, why-driven goal setting |
| Tim Ferriss | Fear-Setting, Dreamlining, 5-Bullet Friday, 4-Hour frameworks | Decision making mode (fear-setting), ideal week planning, weekly review format |
| Hal Elrod | Miracle Morning, SAVERS (Silence, Affirmations, Visualization, Exercise, Reading, Scribing) | Morning ritual framework, journaling integration |
| Robin Sharma | 5 AM Club, 20/20/20 Formula, 4 Interior Empires (Mindset, Heartset, Healthset, Soulset) | Morning routine structure, holistic life area model |
| Jay Shetty | Think Like a Monk, Dharma Discovery | Purpose/contribution area, values-based life design |
| Jordan Peterson | Future Authoring, Self-Authoring Suite, 12 Rules | Life vision writing prompts, future self visualization, responsibility framing |
| Mark Manson | Values Hierarchy, Subtle Art of Not Giving a F*ck | Values-based decision making, honest self-assessment |
| David Allen | GTD Weekly Review | "Open loops" question, unfulfilled commitments tracking |
| Gretchen Rubin | Four Tendencies (Upholder, Questioner, Obliger, Rebel) | Core of coaching style discovery assessment |
| Gary Keller | The ONE Thing | Dashboard "one thing" focus, priority-based goal review |
| Ed Mylett | One More mentality, Max Out | "One more" challenge framework, pushing limits |
| Ryan Holiday | Stoic journaling, Daily Stoic practices | Avoidance question, evening review, what would I do differently |

**Universal patterns across ALL coaches (built into the system):**
1. Clarity of values and vision comes first (profile)
2. Written goals dramatically outperform unwritten ones (goal system)
3. Regular reflection/review is non-negotiable (review system)
4. Accountability to someone/something drives follow-through (AI coaching + tracking)
5. Identity-level change outlasts behavior-level change (identity statements)
6. Energy management is as important as time management (energy tracking)
7. Gratitude practice improves every other metric (review questions)
8. What you avoid reveals more than what you pursue (avoidance question)
9. The "why" behind a goal matters more than the "what" (purpose field)
10. Celebration of progress prevents burnout (celebration mode, dashboard wins)

---

*Awaiting your review. Let me know which optimizations to accept, modify, or reject before we build.*
