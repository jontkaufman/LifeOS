import { useState, useEffect, useRef, useCallback } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useChat, type ToolActivity } from '@/hooks/useChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Target, TrendingUp, Sparkles, Send, Loader2, RotateCcw, Pencil, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { sliderHandler } from '@/lib/ui-helpers';
import { api } from '@/lib/api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const { data, coachingMessage, loading, refresh, refreshCoachingMessage, toggleActionItem } = useDashboard();

  useEffect(() => {
    refreshCoachingMessage();
  }, []);

  if (loading || !data) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  const radarData = data.life_areas.map(area => ({
    area: area.name.split(' ')[0],
    importance: area.importance,
    satisfaction: area.satisfaction,
    fullMark: 10,
  }));

  const moodEmoji: Record<string, string> = {
    terrible: '😰', rough: '😟', neutral: '😐', good: '😊', great: '🤩',
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Metrics Center */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Wheel of Life Radar - full width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wheel of Life</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#222633" />
                  <PolarAngleAxis dataKey="area" tick={{ fill: '#9A9DAA', fontSize: 12 }} />
                  <Radar name="Importance" dataKey="importance" stroke="#E8A838" fill="#E8A838" fillOpacity={0.15} />
                  <Radar name="Satisfaction" dataKey="satisfaction" stroke="#50C878" fill="#50C878" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Complete your profile to see your Wheel of Life.</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Review + Active Goals - 2 col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Latest Review</CardTitle>
            </CardHeader>
            <CardContent>
              {data.latest_review ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{
                      (() => { try { return new Date(data.latest_review.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return data.latest_review.date; } })()
                    }</span>
                    <Badge variant={data.latest_review.is_completed ? 'default' : 'secondary'}>
                      {data.latest_review.is_completed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Satisfaction</span>
                      <span className="font-mono">{data.latest_review.life_satisfaction}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Energy</span>
                      <span className="font-mono">{data.latest_review.energy_level}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stress</span>
                      <span className="font-mono">{data.latest_review.stress_level}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Mood</span>
                      <span>{moodEmoji[data.latest_review.overall_mood] || '😐'} {data.latest_review.overall_mood}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No reviews yet. Start your first review!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" /> Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.goals.length > 0 ? (
                <div className="space-y-3">
                  {data.goals.slice(0, 5).map(goal => (
                    <DashboardGoalRow key={goal.id} goal={goal} onUpdate={refresh} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No active goals. Create your first goal!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Items + Calendar - 2 col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.action_items.length > 0 ? (
                <div className="space-y-2">
                  {data.action_items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleActionItem(item.id)}
                      className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-accent transition-colors"
                    >
                      {item.is_completed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No action items yet. They'll appear from your coaching conversations.</p>
              )}
            </CardContent>
          </Card>

          <CalendarWidget />
        </div>
      </div>

      {/* Chat Pane */}
      <DashboardChat coachingMessage={coachingMessage} />
    </div>
  );
}

const DASHBOARD_CONVO_KEY = 'lifeos_dashboard_convo_id';

function DashboardChat({ coachingMessage }: { coachingMessage: string | null }) {
  const {
    activeConvo, streaming, streamContent, toolActivity,
    createConversation, loadConversation, sendMessage,
  } = useChat();

  const [input, setInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing dashboard conversation or create a new one
  const initConvo = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);
    const savedId = localStorage.getItem(DASHBOARD_CONVO_KEY);
    if (savedId) {
      try {
        const convo = await loadConversation(Number(savedId));
        if (convo && 'id' in convo && convo.messages) return;
      } catch { /* conversation was deleted or errored, create new */ }
      localStorage.removeItem(DASHBOARD_CONVO_KEY);
    }
    const convo = await createConversation('check_in');
    if (convo) localStorage.setItem(DASHBOARD_CONVO_KEY, String(convo.id));
  }, [initialized, createConversation, loadConversation]);

  useEffect(() => {
    initConvo();
  }, [initConvo]);

  const handleReset = async () => {
    localStorage.removeItem(DASHBOARD_CONVO_KEY);
    const convo = await createConversation('check_in');
    if (convo) localStorage.setItem(DASHBOARD_CONVO_KEY, String(convo.id));
  };

  // Scroll to bottom on new messages or tool activity
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages, streamContent, toolActivity]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-96 shrink-0 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Coach
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleReset} disabled={streaming} className="h-7 w-7">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-4">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Coaching message as styled header */}
          {coachingMessage && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 mb-2">
              <p className="text-sm leading-relaxed">{coachingMessage}</p>
            </div>
          )}

          {/* Conversation messages */}
          {activeConvo?.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card rounded-tl-sm'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? '' : 'prose-invert'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Tool activity */}
          {toolActivity.length > 0 && (
            <DashboardToolActivity activities={toolActivity} />
          )}

          {/* Streaming indicator */}
          {streaming && streamContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-card rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{streamContent}</ReactMarkdown>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Typing...</span>
                </div>
              </div>
            </div>
          )}

          {streaming && !streamContent && (
            <div className="flex justify-start">
              <div className="bg-card rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to your coach..."
            rows={2}
            className="resize-none text-sm"
          />
          <Button onClick={handleSend} disabled={!input.trim() || streaming} size="icon" className="self-end shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardGoalRow({ goal, onUpdate }: { goal: { id: number; title: string; status: string; progress: number; priority: string }; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(goal.progress);

  const handleSave = async () => {
    await api.put(`/goals/${goal.id}`, { progress });
    setEditing(false);
    onUpdate();
  };

  const handleComplete = async () => {
    await api.put(`/goals/${goal.id}`, { status: 'completed', progress: 100 });
    onUpdate();
  };

  if (editing) {
    return (
      <div className="space-y-2 p-2 rounded-lg bg-accent/30">
        <p className="text-sm font-medium truncate">{goal.title}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Progress</span>
          <Slider
            value={[progress]}
            onValueChange={sliderHandler(v => setProgress(v))}
            min={0} max={100} step={5}
            className="flex-1"
          />
          <span className="text-xs font-mono w-8 text-right">{progress}%</span>
        </div>
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => { setProgress(goal.progress); setEditing(false); }} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7 text-xs">
            <Check className="h-3 w-3 mr-1" /> Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{goal.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={goal.progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground font-mono">{goal.progress}%</span>
        </div>
      </div>
      <Badge variant="outline" className="shrink-0 text-xs">
        {goal.priority}
      </Badge>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7" title="Edit progress">
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleComplete} className="h-7 w-7 text-green-400 hover:text-green-300" title="Mark complete">
          <CheckCircle2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  all_day: boolean;
  location: string | null;
}

function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<CalendarEvent[] | { error: string; events: CalendarEvent[] }>('/calendar/events?days=7')
      .then(result => {
        if (Array.isArray(result)) {
          setEvents(result);
        } else if ('events' in result) {
          setEvents(result.events);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || events.length === 0) return null;

  const formatEventTime = (start: string, allDay: boolean) => {
    if (allDay) return 'All day';
    try {
      return new Date(start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return start;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" /> Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="w-1 h-8 bg-primary/50 rounded-full shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{event.summary}</p>
                <p className="text-xs text-muted-foreground">{formatEventTime(event.start, event.all_day)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardToolActivity({ activities }: { activities: ToolActivity[] }) {
  return (
    <div className="flex justify-start">
      <div className="bg-card/50 border border-border/50 rounded-lg px-2 py-1.5 space-y-0.5 text-xs">
        {activities.map((a, i) => (
          <div key={`${a.tool}-${i}`} className="flex items-center gap-1.5 text-muted-foreground">
            {a.status === 'running' ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            )}
            <span>{a.display_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
