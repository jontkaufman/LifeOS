import { useState } from 'react';
import { useReviews, type Review } from '@/hooks/useReviews';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
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

export default function Reviews() {
  const { reviews, current, loading, updateReview, completeReview } = useReviews();
  const { data: profileData } = useProfile();
  const areas = profileData?.life_areas || [];

  if (loading) return <div className="text-muted-foreground">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          {current ? (
            <ReviewEditor review={current} areas={areas} onUpdate={updateReview} onComplete={completeReview} />
          ) : (
            <p className="text-muted-foreground">Loading current review...</p>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-3">
            {reviews.filter(r => r.is_completed).map(review => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{review.week_id}</Badge>
                      <span className="text-sm text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>😊 {review.overall_mood}</span>
                      <span>Satisfaction: <span className="font-mono">{review.life_satisfaction}/10</span></span>
                      <span>Energy: <span className="font-mono">{review.energy_level}/10</span></span>
                    </div>
                  </div>
                  {review.ai_analysis && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium text-primary">AI Analysis</span>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{review.ai_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {reviews.filter(r => r.is_completed).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No completed reviews yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewEditor({ review, areas, onUpdate, onComplete }: {
  review: Review;
  areas: Array<{ id: number; name: string; icon: string; color: string }>;
  onUpdate: (id: number, data: Record<string, unknown>) => void;
  onComplete: (id: number) => Promise<void>;
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
          <Badge variant="outline" className="text-lg px-3 py-1">{review.week_id}</Badge>
          {review.is_completed ? (
            <Badge className="bg-green-500/10 text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>
          ) : (
            <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>
          )}
        </div>
        {!review.is_completed && (
          <Button onClick={() => onComplete(review.id)}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Review
          </Button>
        )}
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
            { field: 'wins', label: 'Wins & Accomplishments', placeholder: 'What went well this week?' },
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
        <CardHeader><CardTitle className="text-lg">Next Week</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Top Priorities</Label>
            <Textarea
              placeholder="What are your top priorities for next week?"
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
