import { useState, useEffect, useRef, useCallback } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useChat, type ToolActivity } from '@/hooks/useChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Target, TrendingUp, Sparkles, Send, Loader2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const { data, coachingMessage, loading, refreshCoachingMessage, toggleActionItem } = useDashboard();

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
                    <span className="text-sm text-muted-foreground">{data.latest_review.week_id}</span>
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
                <p className="text-muted-foreground text-sm">No reviews yet. Start your first weekly review!</p>
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
                    <div key={goal.id} className="flex items-center gap-3">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No active goals. Create your first goal!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Items - full width */}
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
      </div>

      {/* Chat Pane */}
      <DashboardChat coachingMessage={coachingMessage} />
    </div>
  );
}

function DashboardChat({ coachingMessage }: { coachingMessage: string | null }) {
  const {
    activeConvo, streaming, streamContent, toolActivity,
    createConversation, sendMessage,
  } = useChat();

  const [input, setInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-create a check_in conversation on mount
  const initConvo = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);
    await createConversation('check_in');
  }, [initialized, createConversation]);

  useEffect(() => {
    initConvo();
  }, [initConvo]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages, streamContent]);

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
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Coach
        </CardTitle>
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
