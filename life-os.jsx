import { useState, useEffect, useCallback } from "react";

const LIFE_AREAS = [
  { key: "career", label: "Career / Work", icon: "◆", color: "#E8A838" },
  { key: "finances", label: "Finances", icon: "◈", color: "#4ECDC4" },
  { key: "relationships", label: "Relationships", icon: "◉", color: "#FF6B6B" },
  { key: "growth", label: "Personal Growth", icon: "◎", color: "#A78BFA" },
];

const TABS = ["dashboard", "profile", "goals", "review", "history"];

// ─── Storage helpers ───
async function load(key, fallback) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}
async function save(key, val) {
  try {
    await window.storage.set(key, JSON.stringify(val));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// ─── Date helpers ───
function weekId(d = new Date()) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Default data ───
const DEFAULT_PROFILE = {
  name: "",
  vision: "",
  values: "",
  context: "",
  areas: {
    career: { description: "", currentState: "" },
    finances: { description: "", currentState: "" },
    relationships: { description: "", currentState: "" },
    growth: { description: "", currentState: "" },
  },
};

const DEFAULT_GOALS = {
  career: [],
  finances: [],
  relationships: [],
  growth: [],
};

function makeReview() {
  return {
    weekId: weekId(),
    date: todayStr(),
    completed: false,
    wins: "",
    challenges: "",
    lessons: "",
    scores: { career: 5, finances: 5, relationships: 5, growth: 5 },
    nextWeekPriorities: "",
    energyLevel: 5,
    overallMood: "neutral",
    aiNotes: "",
  };
}

// ─── Styles ───
const fonts = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
`;

const css = `
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg: #0D0F14;
  --bg2: #13151C;
  --bg3: #1A1D27;
  --bg4: #222633;
  --border: #2A2E3B;
  --text: #E8E9ED;
  --text2: #9A9DAA;
  --text3: #5F6270;
  --accent: #E8A838;
  --accent2: #4ECDC4;
  --red: #FF6B6B;
  --purple: #A78BFA;
  --green: #6BCB77;
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius: 12px;
}
body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

.app { max-width: 960px; margin: 0 auto; padding: 20px 16px 80px; min-height: 100vh; }

/* Nav */
.nav { display:flex; gap:4px; background: var(--bg2); border:1px solid var(--border); border-radius: 16px; padding: 4px; margin-bottom: 32px; overflow-x:auto; }
.nav button { flex:1; padding: 10px 12px; border:none; background:transparent; color:var(--text3); font-family:var(--font-body); font-size:13px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; border-radius:12px; cursor:pointer; transition: all .2s; white-space:nowrap; }
.nav button:hover { color:var(--text2); }
.nav button.active { background: var(--bg4); color: var(--accent); }

/* Header */
.page-header { margin-bottom: 28px; }
.page-header h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: var(--text); letter-spacing: -0.01em; }
.page-header p { color: var(--text2); font-size: 14px; margin-top: 6px; line-height: 1.5; }

/* Cards */
.card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 16px; transition: border-color .2s; }
.card:hover { border-color: var(--bg4); }
.card-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.card-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; }
.card-title { font-family:var(--font-display); font-size:18px; }
.card-subtitle { color:var(--text2); font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.06em; }

/* Forms */
label.field { display:block; margin-bottom: 18px; }
label.field .label-text { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--text2); margin-bottom:6px; display:block; }
input[type="text"], textarea {
  width:100%; background:var(--bg3); border:1px solid var(--border); border-radius:8px;
  padding:10px 14px; color:var(--text); font-family:var(--font-body); font-size:14px;
  outline:none; transition: border-color .2s; resize: vertical;
}
input:focus, textarea:focus { border-color: var(--accent); }
textarea { min-height: 80px; line-height: 1.6; }

/* Buttons */
.btn { display:inline-flex; align-items:center; gap:6px; padding:10px 20px; border-radius:8px; border:none; font-family:var(--font-body); font-size:14px; font-weight:600; cursor:pointer; transition: all .15s; }
.btn-primary { background:var(--accent); color:#0D0F14; }
.btn-primary:hover { filter:brightness(1.1); transform:translateY(-1px); }
.btn-secondary { background:var(--bg4); color:var(--text); }
.btn-secondary:hover { background:var(--border); }
.btn-danger { background:transparent; border:1px solid var(--red); color:var(--red); }
.btn-danger:hover { background:rgba(255,107,107,.1); }
.btn-sm { padding: 6px 14px; font-size: 12px; }

/* Score slider */
.score-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.score-label { min-width:120px; font-size:13px; color:var(--text2); display:flex; align-items:center; gap:8px; }
.score-val { font-family:var(--font-mono); font-size:14px; font-weight:500; min-width:28px; text-align:center; }
input[type="range"] {
  flex:1; -webkit-appearance:none; height:6px; background:var(--bg4); border-radius:3px; outline:none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance:none; width:18px; height:18px; border-radius:50%; cursor:pointer; border:2px solid var(--bg); transition:.15s;
}

/* Mood */
.mood-row { display:flex; gap:8px; flex-wrap:wrap; }
.mood-btn { padding:8px 16px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--text2); font-size:13px; cursor:pointer; transition:.2s; font-family:var(--font-body); }
.mood-btn:hover { border-color:var(--text3); }
.mood-btn.active { border-color:var(--accent); color:var(--accent); background:rgba(232,168,56,.08); }

/* Stats grid */
.stats-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:24px; }
.stat-card { background:var(--bg3); border-radius:10px; padding:16px 20px; }
.stat-card .stat-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--text3); margin-bottom:4px; }
.stat-card .stat-val { font-family:var(--font-display); font-size:26px; }

/* Goal item */
.goal-item { display:flex; align-items:flex-start; gap:10px; padding:12px 0; border-bottom:1px solid var(--border); }
.goal-item:last-child { border-bottom:none; }
.goal-check { width:20px; height:20px; border-radius:6px; border:2px solid var(--border); background:transparent; cursor:pointer; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center; font-size:12px; color:transparent; transition:.2s; }
.goal-check.done { border-color:var(--green); background:var(--green); color:#0D0F14; }
.goal-text { flex:1; font-size:14px; line-height:1.5; }
.goal-text.done { color:var(--text3); text-decoration:line-through; }
.goal-meta { font-size:11px; color:var(--text3); margin-top:2px; }
.goal-actions { display:flex; gap:4px; }
.goal-actions button { background:none; border:none; color:var(--text3); cursor:pointer; padding:4px; font-size:14px; }
.goal-actions button:hover { color:var(--red); }

/* Timeline */
.timeline-item { border-left:2px solid var(--border); padding:0 0 24px 20px; margin-left:8px; position:relative; }
.timeline-item::before { content:''; position:absolute; left:-5px; top:4px; width:8px; height:8px; border-radius:50%; background:var(--accent); border:2px solid var(--bg2); }
.timeline-item:last-child { border-left-color:transparent; }
.timeline-date { font-family:var(--font-mono); font-size:12px; color:var(--text3); margin-bottom:4px; }
.timeline-scores { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.timeline-chip { font-size:11px; padding:3px 8px; border-radius:4px; background:var(--bg4); color:var(--text2); font-family:var(--font-mono); }

/* Progress bar */
.progress-bar { height:6px; background:var(--bg4); border-radius:3px; overflow:hidden; margin-top:8px; }
.progress-fill { height:100%; border-radius:3px; transition: width .4s ease; }

/* Add goal row */
.add-goal-row { display:flex; gap:8px; margin-top:12px; }
.add-goal-row input { flex:1; }

/* Loading */
.loading { display:flex; align-items:center; justify-content:center; height:300px; color:var(--text3); font-size:14px; }
.loading::after { content:''; width:20px; height:20px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; margin-left:12px; animation: spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Empty */
.empty { text-align:center; padding:40px 20px; color:var(--text3); }
.empty-icon { font-size:32px; margin-bottom:12px; }

/* Responsive */
@media (max-width:600px) {
  .stats-grid { grid-template-columns:1fr 1fr; }
  .score-label { min-width:90px; font-size:12px; }
  .nav button { font-size:11px; padding:8px 6px; }
}
`;

// ─── Components ───

function Nav({ tab, setTab }) {
  const labels = { dashboard: "Dashboard", profile: "Profile", goals: "Goals", review: "Weekly Review", history: "History" };
  return (
    <div className="nav">
      {TABS.map((t) => (
        <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
          {labels[t]}
        </button>
      ))}
    </div>
  );
}

function Dashboard({ profile, goals, reviews }) {
  const latestReview = reviews.length ? reviews[reviews.length - 1] : null;
  const totalGoals = Object.values(goals).flat().length;
  const doneGoals = Object.values(goals).flat().filter((g) => g.done).length;
  const streak = reviews.filter((r) => r.completed).length;

  return (
    <div>
      <div className="page-header">
        <h1>{profile.name ? `Welcome back, ${profile.name}` : "Life Operating System"}</h1>
        <p>Your command center for intentional living. Current week: {weekId()}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Goals</div>
          <div className="stat-val" style={{ color: "var(--accent)" }}>{totalGoals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-val" style={{ color: "var(--green)" }}>{doneGoals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reviews Done</div>
          <div className="stat-val" style={{ color: "var(--accent2)" }}>{streak}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-val" style={{ color: "var(--purple)" }}>
            {totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0}%
          </div>
        </div>
      </div>

      {LIFE_AREAS.map((area) => {
        const areaGoals = goals[area.key] || [];
        const done = areaGoals.filter((g) => g.done).length;
        const pct = areaGoals.length ? (done / areaGoals.length) * 100 : 0;
        return (
          <div className="card" key={area.key}>
            <div className="card-header">
              <div className="card-icon" style={{ background: area.color + "18", color: area.color }}>{area.icon}</div>
              <div>
                <div className="card-title">{area.label}</div>
                <div className="card-subtitle">{done}/{areaGoals.length} goals complete</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: pct + "%", background: area.color }} />
            </div>
            {latestReview && (
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--text2)" }}>
                Last review score: <span style={{ color: area.color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{latestReview.scores[area.key]}/10</span>
              </div>
            )}
          </div>
        );
      })}

      {!profile.name && (
        <div className="empty">
          <div className="empty-icon">◈</div>
          <p>Start by filling out your <strong>Profile</strong> — your vision, values, and context about each life area.</p>
        </div>
      )}
    </div>
  );
}

function Profile({ profile, setProfile, onSave }) {
  const update = (path, val) => {
    const p = { ...profile };
    if (path.includes(".")) {
      const [a, b, c] = path.split(".");
      p[a] = { ...p[a], [b]: { ...p[a][b], [c]: val } };
    } else {
      p[path] = val;
    }
    setProfile(p);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>This is your personal context. The more detail you provide, the better your weekly reviews will be.</p>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Identity</div>
        <label className="field">
          <span className="label-text">Name</span>
          <input type="text" value={profile.name} onChange={(e) => update("name", e.target.value)} placeholder="What should I call you?" />
        </label>
        <label className="field">
          <span className="label-text">Life Vision</span>
          <textarea value={profile.vision} onChange={(e) => update("vision", e.target.value)} placeholder="Where do you want to be in 5-10 years? What does your ideal life look like?" />
        </label>
        <label className="field">
          <span className="label-text">Core Values</span>
          <textarea value={profile.values} onChange={(e) => update("values", e.target.value)} placeholder="What principles guide your decisions? (e.g., integrity, growth, freedom, family...)" />
        </label>
        <label className="field">
          <span className="label-text">Current Life Context</span>
          <textarea value={profile.context} onChange={(e) => update("context", e.target.value)} placeholder="Anything important about your current situation — age, career stage, family, location, constraints..." />
        </label>
      </div>

      {LIFE_AREAS.map((area) => (
        <div className="card" key={area.key}>
          <div className="card-header">
            <div className="card-icon" style={{ background: area.color + "18", color: area.color }}>{area.icon}</div>
            <div className="card-title">{area.label}</div>
          </div>
          <label className="field">
            <span className="label-text">What does success look like here?</span>
            <textarea
              value={profile.areas[area.key]?.description || ""}
              onChange={(e) => update(`areas.${area.key}.description`, e.target.value)}
              placeholder={`Describe your aspirations for ${area.label.toLowerCase()}...`}
            />
          </label>
          <label className="field">
            <span className="label-text">Current State</span>
            <textarea
              value={profile.areas[area.key]?.currentState || ""}
              onChange={(e) => update(`areas.${area.key}.currentState`, e.target.value)}
              placeholder="Where are you right now in this area? Be honest — this is your baseline."
            />
          </label>
        </div>
      ))}

      <button className="btn btn-primary" onClick={onSave} style={{ marginTop: 8 }}>Save Profile</button>
    </div>
  );
}

function Goals({ goals, setGoals, onSave }) {
  const [newGoals, setNewGoals] = useState({ career: "", finances: "", relationships: "", growth: "" });

  const addGoal = (area) => {
    if (!newGoals[area].trim()) return;
    const updated = { ...goals, [area]: [...(goals[area] || []), { id: Date.now(), text: newGoals[area].trim(), done: false, created: todayStr() }] };
    setGoals(updated);
    setNewGoals({ ...newGoals, [area]: "" });
    onSave(updated);
  };

  const toggleGoal = (area, id) => {
    const updated = { ...goals, [area]: goals[area].map((g) => (g.id === id ? { ...g, done: !g.done } : g)) };
    setGoals(updated);
    onSave(updated);
  };

  const removeGoal = (area, id) => {
    const updated = { ...goals, [area]: goals[area].filter((g) => g.id !== id) };
    setGoals(updated);
    onSave(updated);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Goals & Targets</h1>
        <p>Set concrete, measurable goals for each life area. Review and adjust weekly.</p>
      </div>

      {LIFE_AREAS.map((area) => {
        const areaGoals = goals[area.key] || [];
        return (
          <div className="card" key={area.key}>
            <div className="card-header">
              <div className="card-icon" style={{ background: area.color + "18", color: area.color }}>{area.icon}</div>
              <div>
                <div className="card-title">{area.label}</div>
                <div className="card-subtitle">{areaGoals.filter((g) => g.done).length}/{areaGoals.length} complete</div>
              </div>
            </div>

            {areaGoals.length === 0 && <div style={{ color: "var(--text3)", fontSize: 13, padding: "8px 0" }}>No goals yet. Add your first one below.</div>}

            {areaGoals.map((g) => (
              <div className="goal-item" key={g.id}>
                <button className={`goal-check ${g.done ? "done" : ""}`} onClick={() => toggleGoal(area.key, g.id)}>
                  {g.done ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div className={`goal-text ${g.done ? "done" : ""}`}>{g.text}</div>
                  <div className="goal-meta">Added {g.created}</div>
                </div>
                <div className="goal-actions">
                  <button onClick={() => removeGoal(area.key, g.id)} title="Remove">×</button>
                </div>
              </div>
            ))}

            <div className="add-goal-row">
              <input
                type="text"
                value={newGoals[area.key]}
                onChange={(e) => setNewGoals({ ...newGoals, [area.key]: e.target.value })}
                placeholder={`Add a ${area.label.toLowerCase()} goal...`}
                onKeyDown={(e) => e.key === "Enter" && addGoal(area.key)}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => addGoal(area.key)}>Add</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyReview({ review, setReview, onSave, profile, goals }) {
  const moods = ["terrible", "rough", "neutral", "good", "great"];

  const update = (key, val) => setReview({ ...review, [key]: val });
  const updateScore = (area, val) => setReview({ ...review, scores: { ...review.scores, [area]: parseInt(val) } });

  const handleComplete = () => {
    const completed = { ...review, completed: true };
    setReview(completed);
    onSave(completed);
  };

  const generateAIPrompt = () => {
    const prompt = `I just completed my weekly review for ${review.weekId}. Here's my context:\n\nProfile: ${profile.name}, Vision: ${profile.vision}\nValues: ${profile.values}\n\nThis week:\n- Wins: ${review.wins}\n- Challenges: ${review.challenges}\n- Lessons: ${review.lessons}\n- Scores: ${JSON.stringify(review.scores)}\n- Energy: ${review.energyLevel}/10\n- Mood: ${review.overallMood}\n- Next week priorities: ${review.nextWeekPriorities}\n\nGoals: ${JSON.stringify(goals)}\n\nPlease analyze my week and give me:\n1. Honest assessment of my progress\n2. Patterns you notice\n3. Specific suggestions for next week\n4. One thing I should stop doing and one thing I should start doing`;
    
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Weekly Review</h1>
        <p>Week of {review.weekId} · {review.completed ? "✓ Completed" : "In progress"}</p>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Reflect on Your Week</div>

        <label className="field">
          <span className="label-text">Wins — What went well?</span>
          <textarea value={review.wins} onChange={(e) => update("wins", e.target.value)} placeholder="Celebrate your progress, no matter how small..." />
        </label>
        <label className="field">
          <span className="label-text">Challenges — What was hard?</span>
          <textarea value={review.challenges} onChange={(e) => update("challenges", e.target.value)} placeholder="What obstacles did you face? What held you back?" />
        </label>
        <label className="field">
          <span className="label-text">Lessons — What did you learn?</span>
          <textarea value={review.lessons} onChange={(e) => update("lessons", e.target.value)} placeholder="What insights came from this week's experiences?" />
        </label>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Score Each Area</div>
        <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16 }}>Rate your satisfaction from 1 (terrible) to 10 (crushing it)</p>

        {LIFE_AREAS.map((area) => (
          <div className="score-row" key={area.key}>
            <div className="score-label">
              <span style={{ color: area.color }}>{area.icon}</span> {area.label}
            </div>
            <input
              type="range" min="1" max="10" value={review.scores[area.key]}
              onChange={(e) => updateScore(area.key, e.target.value)}
              style={{ accentColor: area.color }}
            />
            <div className="score-val" style={{ color: area.color }}>{review.scores[area.key]}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Energy & Mood</div>

        <div className="score-row" style={{ marginBottom: 16 }}>
          <div className="score-label">⚡ Energy Level</div>
          <input type="range" min="1" max="10" value={review.energyLevel} onChange={(e) => update("energyLevel", parseInt(e.target.value))} style={{ accentColor: "var(--accent)" }} />
          <div className="score-val">{review.energyLevel}</div>
        </div>

        <div className="label-text" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text2)", marginBottom: 8 }}>Overall Mood</div>
        <div className="mood-row">
          {moods.map((m) => (
            <button key={m} className={`mood-btn ${review.overallMood === m ? "active" : ""}`} onClick={() => update("overallMood", m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Next Week</div>
        <label className="field">
          <span className="label-text">Top Priorities for Next Week</span>
          <textarea value={review.nextWeekPriorities} onChange={(e) => update("nextWeekPriorities", e.target.value)} placeholder="What are the 3-5 most important things to focus on?" />
        </label>
        <label className="field">
          <span className="label-text">AI Coach Notes</span>
          <textarea value={review.aiNotes} onChange={(e) => update("aiNotes", e.target.value)} placeholder="Paste any notes or insights from your AI coaching session here..." />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={handleComplete}>
          {review.completed ? "Update Review" : "Complete Review"} ✓
        </button>
        <button className="btn btn-secondary" onClick={generateAIPrompt}>
          Ask AI Coach for Analysis →
        </button>
      </div>
    </div>
  );
}

function History({ reviews }) {
  if (!reviews.length) {
    return (
      <div>
        <div className="page-header">
          <h1>Review History</h1>
          <p>Your completed weekly reviews will appear here as a timeline.</p>
        </div>
        <div className="empty">
          <div className="empty-icon">◎</div>
          <p>No reviews yet. Complete your first weekly review to start tracking your journey.</p>
        </div>
      </div>
    );
  }

  const sorted = [...reviews].sort((a, b) => b.weekId.localeCompare(a.weekId));

  return (
    <div>
      <div className="page-header">
        <h1>Review History</h1>
        <p>{reviews.length} review{reviews.length !== 1 ? "s" : ""} recorded</p>
      </div>

      {/* Trend */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Score Trends</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12 }}>
          {LIFE_AREAS.map((area) => {
            const scores = sorted.map((r) => r.scores[area.key]).reverse();
            const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
            const latest = scores.length ? scores[scores.length - 1] : "—";
            const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;
            return (
              <div key={area.key} style={{ background: "var(--bg3)", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, color: area.color, fontWeight: 600, marginBottom: 4 }}>{area.icon} {area.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "var(--text)" }}>{latest}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  avg {avg} · {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}{Math.abs(trend)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 20 }}>Timeline</div>
        {sorted.map((r) => (
          <div className="timeline-item" key={r.weekId}>
            <div className="timeline-date">{r.weekId} · {r.date}</div>
            <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>
              {r.overallMood !== "neutral" && <span style={{ marginRight: 8 }}>Mood: {r.overallMood}</span>}
              {r.energyLevel && <span>Energy: {r.energyLevel}/10</span>}
            </div>
            {r.wins && <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}><strong style={{ color: "var(--green)" }}>Wins:</strong> {r.wins.substring(0, 150)}{r.wins.length > 150 ? "..." : ""}</div>}
            {r.lessons && <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}><strong style={{ color: "var(--purple)" }}>Lessons:</strong> {r.lessons.substring(0, 150)}{r.lessons.length > 150 ? "..." : ""}</div>}
            <div className="timeline-scores">
              {LIFE_AREAS.map((a) => (
                <span className="timeline-chip" key={a.key} style={{ borderLeft: `2px solid ${a.color}` }}>
                  {a.label.split("/")[0].trim()} {r.scores[a.key]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───
export default function LifeOS() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [reviews, setReviews] = useState([]);
  const [currentReview, setCurrentReview] = useState(makeReview());
  const [saved, setSaved] = useState("");

  // Load all data on mount
  useEffect(() => {
    (async () => {
      const [p, g, r] = await Promise.all([
        load("lifeos-profile", DEFAULT_PROFILE),
        load("lifeos-goals", DEFAULT_GOALS),
        load("lifeos-reviews", []),
      ]);
      setProfile(p);
      setGoals(g);
      setReviews(r);

      // Load or create current week's review
      const currentWeek = weekId();
      const existing = r.find((rev) => rev.weekId === currentWeek);
      if (existing) {
        setCurrentReview(existing);
      }
      setLoading(false);
    })();
  }, []);

  const flash = (msg) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2000);
  };

  const saveProfile = async () => {
    await save("lifeos-profile", profile);
    flash("Profile saved ✓");
  };

  const saveGoals = async (g) => {
    await save("lifeos-goals", g || goals);
    flash("Goals saved ✓");
  };

  const saveReview = async (rev) => {
    const updated = reviews.filter((r) => r.weekId !== rev.weekId);
    updated.push(rev);
    setReviews(updated);
    setCurrentReview(rev);
    await save("lifeos-reviews", updated);
    flash("Review saved ✓");
  };

  if (loading) return <div className="app"><div className="loading">Loading your Life OS</div></div>;

  return (
    <>
      <style>{fonts}{css}</style>
      <div className="app">
        {/* Toast */}
        {saved && (
          <div style={{
            position: "fixed", top: 20, right: 20, background: "var(--green)", color: "#0D0F14",
            padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, zIndex: 999,
            animation: "fadeIn .2s ease"
          }}>
            {saved}
          </div>
        )}

        <Nav tab={tab} setTab={setTab} />

        {tab === "dashboard" && <Dashboard profile={profile} goals={goals} reviews={reviews} />}
        {tab === "profile" && <Profile profile={profile} setProfile={setProfile} onSave={saveProfile} />}
        {tab === "goals" && <Goals goals={goals} setGoals={setGoals} onSave={saveGoals} />}
        {tab === "review" && <WeeklyReview review={currentReview} setReview={setCurrentReview} onSave={saveReview} profile={profile} goals={goals} />}
        {tab === "history" && <History reviews={reviews} />}
      </div>
    </>
  );
}
