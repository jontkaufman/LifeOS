import { useState, useEffect } from 'react';
import { useReviews, type Review } from '@/hooks/useReviews';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, Sparkles, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { sliderHandler } from '@/lib/ui-helpers';

const MOOD_OPTIONS = [
  { value: 'terrible', label: '😰 Terrible' },
  { value: 'rough', label: '😟 Rough' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'good', label: '😊 Good' },
  { value: 'great', label: '🤩 Great' },
];

const SUPPORT_OPTIONS = [
  { value: 'accountability', label: 'Accountability' },
  { value: 'encouragement', label: 'Encouragement' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'listening', label: 'Listening' },
  { value: 'challenge', label: 'Challenge' },
];

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ------------------------------------------------------------------ */
/*  Trends Chart                                                       */
/* ------------------------------------------------------------------ */

interface TrendData {
  date: string;
  life_satisfaction: number;
  alignment_score: number;
  stress_level: number;
  energy_level: number;
  mood: string;
  area_scores: Record<number, number>;
}

const MOOD_NUMERIC: Record<string, number> = {
  terrible: 1, rough: 3, neutral: 5, good: 7, great: 9,
};

const AREA_COLORS = ['#50C878', '#E8A838', '#5B8DEF', '#E85D75', '#A78BFA', '#F59E42', '#38BDF8', '#F472B6'];

function TrendsChart({ areas }: { areas: Array<{ id: number; name: string; icon: string; color: string }> }) {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'overall' | 'areas'>('overall');

  useEffect(() => {
    api.get<TrendData[]>('/reviews/trends')
      .then(data => {
        setTrends(data.reverse());
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || trends.length === 0) return null;

  const overallData = trends.map(t => ({
    date: formatDateShort(t.date),
    Satisfaction: t.life_satisfaction,
    Alignment: t.alignment_score,
    Stress: t.stress_level,
    Energy: t.energy_level,
    Mood: MOOD_NUMERIC[t.mood] ?? 5,
  }));

  const areaData = trends.map(t => {
    const entry: Record<string, string | number> = { date: formatDateShort(t.date) };
    for (const area of areas) {
      // JSON keys are strings, so look up by string ID
      const score = t.area_scores[area.id] ?? (t.area_scores as unknown as Record<string, number>)[String(area.id)];
      if (score !== undefined) {
        entry[area.name] = score;
      }
    }
    return entry;
  });

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Trends</CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={view === 'overall' ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setView('overall')}
            >
              Overall Assessment
            </Button>
            <Button
              size="sm"
              variant={view === 'areas' ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setView('areas')}
            >
              Life Areas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          {view === 'overall' ? (
            <LineChart data={overallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222633" />
              <XAxis dataKey="date" tick={{ fill: '#9A9DAA', fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#9A9DAA', fontSize: 11 }} width={30} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1b2e', border: '1px solid #2a2b3e', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Satisfaction" stroke="#50C878" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Energy" stroke="#5B8DEF" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Stress" stroke="#E85D75" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Alignment" stroke="#E8A838" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Mood" stroke="#A78BFA" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          ) : (
            <LineChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222633" />
              <XAxis dataKey="date" tick={{ fill: '#9A9DAA', fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#9A9DAA', fontSize: 11 }} width={30} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1b2e', border: '1px solid #2a2b3e', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {areas.map((area, i) => (
                <Line
                  key={area.id}
                  type="monotone"
                  dataKey={area.name}
                  stroke={AREA_COLORS[i % AREA_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function Reviews() {
  const { reviews, activeReview, setActiveReview, loading, createReview, deleteReview, updateReview, completeReview } = useReviews();
  const { data: profileData } = useProfile();
  const areas = profileData?.life_areas || [];

  // Auto-select an in-progress review for the check-in tab
  useEffect(() => {
    if (!activeReview && reviews.length > 0) {
      const draft = reviews.find(r => !r.is_completed);
      if (draft) setActiveReview(draft);
    }
  }, [reviews, activeReview, setActiveReview]);

  if (loading) return <div className="text-muted-foreground">Loading reviews...</div>;

  const completedReviews = reviews.filter(r => r.is_completed);

  return (
    <div className="space-y-0 h-full flex flex-col">
      {/* Trends chart at top */}
      <TrendsChart areas={areas} />

      <Tabs defaultValue="checkin" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="checkin">Check-in</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-4 flex-1 overflow-y-auto">
          {activeReview && !activeReview.is_completed ? (
            <ReviewEditor
              review={activeReview}
              areas={areas}
              onUpdate={updateReview}
              onComplete={completeReview}
              onDelete={deleteReview}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground mb-4">Ready for a check-in? Reflect on how things are going whenever you want.</p>
              <Button onClick={createReview} size="lg">
                <Plus className="h-4 w-4 mr-2" /> Start Check-in
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 flex-1 overflow-y-auto">
          <div className="space-y-3 max-w-3xl">
            {completedReviews.length > 0 ? (
              completedReviews.map(review => (
                <HistoryCard key={review.id} review={review} areas={areas} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No completed reviews yet. Complete a check-in to see it here.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Editor                                                      */
/* ------------------------------------------------------------------ */

function ReviewEditor({ review, areas, onUpdate, onComplete, onDelete }: {
  review: Review;
  areas: Array<{ id: number; name: string; icon: string; color: string }>;
  onUpdate: (id: number, data: Record<string, unknown>) => void;
  onComplete: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const save = (field: string, value: unknown) => {
    onUpdate(review.id, { [field]: value });
  };

  const saveAreaScore = (lifeAreaId: number, score: number) => {
    onUpdate(review.id, {
      area_scores: [{ life_area_id: lifeAreaId, score }],
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-medium">{formatDate(review.date)}</span>
          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onDelete(review.id)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
          <Button onClick={() => onComplete(review.id)}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Review
          </Button>
        </div>
      </div>

      {/* Gratitude */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Gratitude</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(n => (
            <Textarea
              key={n}
              placeholder={`I'm grateful for... (${n})`}
              value={(review as unknown as Record<string, string>)[`gratitude_${n}`] || ''}
              onChange={e => save(`gratitude_${n}`, e.target.value)}
              rows={1}
            />
          ))}
        </CardContent>
      </Card>

      {/* Reflections */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Reflections</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { field: 'wins', label: 'Wins & Accomplishments', placeholder: 'What went well recently?' },
            { field: 'challenges', label: 'Challenges', placeholder: 'What was difficult?' },
            { field: 'avoiding', label: 'What Am I Avoiding?', placeholder: 'What have I been putting off or not facing?' },
            { field: 'unfulfilled_commitments', label: 'Unfulfilled Commitments', placeholder: 'What did I commit to but not follow through on?' },
            { field: 'lessons', label: 'Lessons Learned', placeholder: 'What insights did I gain?' },
            { field: 'energy_sources', label: 'Energy Sources', placeholder: 'What gave me energy?' },
            { field: 'energy_drains', label: 'Energy Drains', placeholder: 'What drained my energy?' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <Label className="text-sm">{label}</Label>
              <Textarea
                placeholder={placeholder}
                value={(review as unknown as Record<string, string>)[field] || ''}
                onChange={e => save(field, e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Life Area Scores */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Life Area Scores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {areas.map(area => {
            const areaScore = review.area_scores?.find(s => s.life_area_id === area.id);
            const score = areaScore?.score || 5;
            const prevScore = areaScore?.previous_score;
            return (
              <div key={area.id} className="flex items-center gap-4">
                <span className="w-40 text-sm flex items-center gap-2">
                  <span>{area.icon}</span> {area.name}
                </span>
                <Slider
                  value={[score]}
                  onValueChange={sliderHandler(v => saveAreaScore(area.id, v))}
                  min={1} max={10} step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-mono text-sm">
                  {score}/10
                  {prevScore !== null && prevScore !== undefined && (
                    <span className={`text-xs ml-1 ${score > prevScore ? 'text-green-400' : score < prevScore ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {score > prevScore ? '↑' : score < prevScore ? '↓' : '='}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Overall Scores */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Overall Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { field: 'life_satisfaction', label: 'Life Satisfaction' },
            { field: 'alignment_score', label: 'Values Alignment' },
            { field: 'stress_level', label: 'Stress Level' },
            { field: 'energy_level', label: 'Energy Level' },
          ].map(({ field, label }) => (
            <div key={field} className="flex items-center gap-4">
              <span className="w-40 text-sm">{label}</span>
              <Slider
                value={[(review as unknown as Record<string, number>)[field] || 5]}
                onValueChange={sliderHandler(v => save(field, v))}
                min={1} max={10} step={1}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono text-sm">
                {(review as unknown as Record<string, number>)[field] || 5}/10
              </span>
            </div>
          ))}

          <div>
            <Label className="text-sm">Overall Mood</Label>
            <div className="flex gap-2 mt-2">
              {MOOD_OPTIONS.map(m => (
                <Button
                  key={m.value}
                  variant={review.overall_mood === m.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => save('overall_mood', m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Looking Ahead</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Top Priorities</Label>
            <Textarea
              placeholder="What are your top priorities going forward?"
              value={review.next_week_priorities || ''}
              onChange={e => save('next_week_priorities', e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Support Needed</Label>
            <div className="flex gap-2 mt-2">
              {SUPPORT_OPTIONS.map(s => (
                <Button
                  key={s.value}
                  variant={review.support_needed === s.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => save('support_needed', s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {review.ai_analysis && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{review.ai_analysis}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  History Card (expandable)                                          */
/* ------------------------------------------------------------------ */

function HistoryCard({ review, areas }: { review: Review; areas: Array<{ id: number; name: string; icon: string }> }) {
  const [expanded, setExpanded] = useState(false);

  const moodEmoji: Record<string, string> = {
    terrible: '😰', rough: '😟', neutral: '😐', good: '😊', great: '🤩',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-medium">{formatDate(review.date)}</span>
              <Badge className="bg-green-500/10 text-green-400 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Completed</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>{moodEmoji[review.overall_mood] || '😐'} {review.overall_mood}</span>
              <span>Satisfaction: <span className="font-mono">{review.life_satisfaction}/10</span></span>
              <span>Energy: <span className="font-mono">{review.energy_level}/10</span></span>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
            {(review.gratitude_1 || review.gratitude_2 || review.gratitude_3) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Gratitude</p>
                <ul className="text-sm space-y-0.5">
                  {[review.gratitude_1, review.gratitude_2, review.gratitude_3].filter(Boolean).map((g, i) => (
                    <li key={i}>· {g}</li>
                  ))}
                </ul>
              </div>
            )}

            {[
              { label: 'Wins', value: review.wins },
              { label: 'Challenges', value: review.challenges },
              { label: 'Avoiding', value: review.avoiding },
              { label: 'Lessons', value: review.lessons },
              { label: 'Priorities', value: review.next_week_priorities },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{f.label}</p>
                <p className="text-sm">{f.value}</p>
              </div>
            ))}

            {review.area_scores.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Life Area Scores</p>
                <div className="flex flex-wrap gap-2">
                  {review.area_scores.map(s => {
                    const area = areas.find(a => a.id === s.life_area_id);
                    return (
                      <Badge key={s.life_area_id} variant="outline" className="text-xs">
                        {area?.icon} {area?.name?.split(' ')[0] || `Area ${s.life_area_id}`}: {s.score}/10
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4 text-xs">
              <span>Satisfaction: <span className="font-mono">{review.life_satisfaction}/10</span></span>
              <span>Alignment: <span className="font-mono">{review.alignment_score}/10</span></span>
              <span>Stress: <span className="font-mono">{review.stress_level}/10</span></span>
              <span>Energy: <span className="font-mono">{review.energy_level}/10</span></span>
            </div>

            {review.ai_analysis && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Analysis</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{review.ai_analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
