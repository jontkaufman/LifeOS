import { useState } from 'react';
import { useProfile, type LifeArea } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { selectHandler, sliderHandler } from '@/lib/ui-helpers';
import { cn } from '@/lib/utils';

const AREA_HINTS: Record<string, string> = {
  career: "Your professional life — job satisfaction, career growth, work-life balance, sense of purpose at work, professional relationships.",
  finances: "Money & financial health — income, savings, debt, investments, financial security, spending habits, progress toward financial goals.",
  health: "Physical wellbeing — exercise, nutrition, sleep quality, energy levels, medical checkups, chronic conditions, body image.",
  relationships: "Friendships & romantic connections — depth of friendships, social life, dating/partnership, trust, communication, feeling supported.",
  family: "Family bonds — closeness with parents/siblings/children, quality time, family dynamics, boundaries, caregiving responsibilities.",
  personal_growth: "Learning & self-development — education, new skills, mindset, self-awareness, therapy, reading, spiritual practice, creativity.",
  fun_recreation: "Leisure & enjoyment — hobbies, travel, play, entertainment, spontaneity, work-life balance, things that recharge you.",
  environment: "Your living & working spaces — home comfort, organization, neighborhood, commute, workspace setup, sense of safety.",
  spirituality: "Your spiritual or faith life — prayer, meditation, religious community, sense of meaning and transcendence, inner peace.",
  community: "Your social circles beyond close friends/family — volunteering, neighborhood, clubs, professional networks, giving back.",
  education: "Formal or informal learning — courses, certifications, reading, skill development, intellectual curiosity, staying sharp.",
  creativity: "Creative expression — art, music, writing, crafts, design, creative problem-solving, building things.",
};

function LifeAreaCard({ area, onUpdate }: { area: LifeArea; onUpdate: (updates: Partial<LifeArea>) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hint = AREA_HINTS[area.key];

  return (
    <div
      className={cn(
        "border rounded-lg transition-colors overflow-hidden",
        area.is_active ? "border-border bg-card" : "border-border/50 bg-muted/30"
      )}
    >
      {/* Header — no click handler on the row itself */}
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox: isolated in its own label, stops propagation */}
        <Checkbox
          checked={area.is_active}
          onCheckedChange={(checked) => onUpdate({ is_active: checked })}
        />

        <span className="text-lg leading-none">{area.icon}</span>
        <span className={cn("font-medium text-sm flex-1", !area.is_active && "text-muted-foreground")}>
          {area.name}
        </span>

        {hint && (
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Chevron: only button in the header, always visible */}
        <button
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          className="p-1 rounded hover:bg-muted transition-colors"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Expanded Content — only gated on expanded, never on is_active */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Importance: {area.importance}/10</Label>
              <Slider
                value={[area.importance]}
                onValueChange={sliderHandler(v => onUpdate({ importance: v }))}
                min={1} max={10} step={1}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Satisfaction: {area.satisfaction}/10</Label>
              <Slider
                value={[area.satisfaction]}
                onValueChange={sliderHandler(v => onUpdate({ satisfaction: v }))}
                min={1} max={10} step={1}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Current State</Label>
            <Textarea
              value={area.current_state}
              onChange={e => onUpdate({ current_state: e.target.value })}
              placeholder="Where are you right now in this area?"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Goals</Label>
            <Textarea
              value={area.goals}
              onChange={e => onUpdate({ goals: e.target.value })}
              placeholder="What do you want to achieve here?"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Challenges</Label>
            <Textarea
              value={area.challenges}
              onChange={e => onUpdate({ challenges: e.target.value })}
              placeholder="What's getting in the way?"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Success Vision</Label>
            <Textarea
              value={area.success_vision}
              onChange={e => onUpdate({ success_vision: e.target.value })}
              placeholder="What does success look like in 6-12 months?"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Additional Context</Label>
            <Textarea
              value={area.additional_context}
              onChange={e => onUpdate({ additional_context: e.target.value })}
              placeholder="Anything else your coach should know about this area?"
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { data, loading, updateProfile, updateLifeArea, updateIntake } = useProfile();

  if (loading || !data) return <div className="text-muted-foreground">Loading profile...</div>;

  const { profile, intake, life_areas } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Who you are and what drives you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={profile.name}
                onChange={e => updateProfile({ name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label>Preferred Name</Label>
              <Input
                value={profile.preferred_name ?? ''}
                onChange={e => updateProfile({ preferred_name: e.target.value })}
                placeholder="What should I call you?"
              />
            </div>
          </div>
          <div>
            <Label>Life Vision</Label>
            <Textarea
              value={profile.life_vision}
              onChange={e => updateProfile({ life_vision: e.target.value })}
              placeholder="What does your ideal life look like?"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Strengths</Label>
              <Textarea
                value={profile.strengths}
                onChange={e => updateProfile({ strengths: e.target.value })}
                placeholder="What are you great at?"
                rows={2}
              />
            </div>
            <div>
              <Label>Growth Edges</Label>
              <Textarea
                value={profile.growth_edges}
                onChange={e => updateProfile({ growth_edges: e.target.value })}
                placeholder="Where do you want to grow?"
                rows={2}
              />
            </div>
          </div>
          <div>
            <Label>Current Context</Label>
            <Textarea
              value={profile.current_context}
              onChange={e => updateProfile({ current_context: e.target.value })}
              placeholder="What's going on in your life right now?"
              rows={2}
            />
          </div>
          <div>
            <Label>Stage of Change</Label>
            <Select value={profile.stage_of_change} onValueChange={selectHandler(v => updateProfile({ stage_of_change: v }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contemplating">Contemplating</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="acting">Acting</SelectItem>
                <SelectItem value="maintaining">Maintaining</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Life Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Life Areas</CardTitle>
          <CardDescription>Toggle the areas that matter to you and fill in details to help your coach understand each one</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {life_areas.map(area => (
              <LifeAreaCard
                key={area.id}
                area={area}
                onUpdate={(updates) => updateLifeArea(area.id, updates)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coaching Intake */}
      <Card>
        <CardHeader>
          <CardTitle>Coaching Intake</CardTitle>
          <CardDescription>Help your coach understand your baseline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Biggest Stressor</Label>
            <Textarea
              value={intake.biggest_stressor}
              onChange={e => updateIntake({ biggest_stressor: e.target.value })}
              placeholder="What's causing you the most stress right now?"
              rows={2}
            />
          </div>
          <div>
            <Label>Past Coaching Experience</Label>
            <Textarea
              value={intake.past_coaching_experience}
              onChange={e => updateIntake({ past_coaching_experience: e.target.value })}
              placeholder="Have you worked with a coach or therapist before?"
              rows={2}
            />
          </div>
          <div>
            <Label>Support System</Label>
            <Textarea
              value={intake.support_system}
              onChange={e => updateIntake({ support_system: e.target.value })}
              placeholder="Who do you turn to for support?"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sleep Quality: {intake.sleep_quality}/10</Label>
              <Slider
                value={[intake.sleep_quality]}
                onValueChange={sliderHandler(v => updateIntake({ sleep_quality: v }))}
                min={1} max={10} step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Sleep Hours: {intake.sleep_hours}h</Label>
              <Slider
                value={[intake.sleep_hours]}
                onValueChange={sliderHandler(v => updateIntake({ sleep_hours: v }))}
                min={3} max={12} step={0.5}
                className="mt-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Exercise (times/week): {intake.exercise_frequency}</Label>
              <Slider
                value={[intake.exercise_frequency]}
                onValueChange={sliderHandler(v => updateIntake({ exercise_frequency: v }))}
                min={0} max={14} step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Energy Pattern</Label>
              <Select value={intake.energy_pattern} onValueChange={selectHandler(v => updateIntake({ energy_pattern: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning Person</SelectItem>
                  <SelectItem value="evening">Evening Person</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
