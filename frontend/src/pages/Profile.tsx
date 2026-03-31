import { useState } from 'react';
import { useProfile, type Profile as ProfileType } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Trash2, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { selectHandler, sliderHandler } from '@/lib/ui-helpers';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

const AREA_HINTS: Record<string, string> = {
  career: "Your professional life — job satisfaction, career growth, work-life balance, sense of purpose at work, professional relationships.",
  finances: "Money & financial health — income, savings, debt, investments, financial security, spending habits, progress toward financial goals.",
  health: "Physical wellbeing — exercise, nutrition, sleep quality, energy levels, medical checkups, chronic conditions, body image.",
  relationships: "Friendships & romantic connections — depth of friendships, social life, dating/partnership, trust, communication, feeling supported.",
  family: "Family bonds — closeness with parents/siblings/children, quality time, family dynamics, boundaries, caregiving responsibilities.",
  personal_growth: "Learning & self-development — education, new skills, mindset, self-awareness, therapy, reading, spiritual practice, creativity.",
  fun_recreation: "Leisure & enjoyment — hobbies, travel, play, entertainment, spontaneity, work-life balance, things that recharge you.",
  environment: "Your living & working spaces — home comfort, organization, neighborhood, commute, workspace setup, sense of safety.",
};

export default function Profile() {
  const { data, loading, updateProfile, updateLifeArea, updateIntake } = useProfile();

  if (loading || !data) return <div className="text-muted-foreground">Loading profile...</div>;

  const { profile, intake, life_areas } = data;

  const radarData = life_areas.map(area => ({
    area: area.name.split(' ')[0],
    importance: area.importance,
    satisfaction: area.satisfaction,
    fullMark: 10,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Who you are and what drives you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <Label>Pronouns</Label>
              <Input
                value={profile.pronouns ?? ''}
                onChange={e => updateProfile({ pronouns: e.target.value })}
                placeholder="e.g., they/them"
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

      {/* Wheel of Life */}
      <Card>
        <CardHeader>
          <CardTitle>Wheel of Life</CardTitle>
          <CardDescription>Rate the importance and your satisfaction in each life area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#222633" />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#9A9DAA', fontSize: 12 }} />
                <Radar name="Importance" dataKey="importance" stroke="#E8A838" fill="#E8A838" fillOpacity={0.15} />
                <Radar name="Satisfaction" dataKey="satisfaction" stroke="#50C878" fill="#50C878" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {life_areas.map(area => (
                <div key={area.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>{area.icon}</span>
                    <span className="text-sm font-medium">{area.name}</span>
                    {AREA_HINTS[area.key] && (
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          {AREA_HINTS[area.key]}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Importance: {area.importance}</Label>
                      <Slider
                        value={[area.importance]}
                        onValueChange={sliderHandler(v => updateLifeArea(area.id, { importance: v }))}
                        min={1} max={10} step={1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Satisfaction: {area.satisfaction}</Label>
                      <Slider
                        value={[area.satisfaction]}
                        onValueChange={sliderHandler(v => updateLifeArea(area.id, { satisfaction: v }))}
                        min={1} max={10} step={1}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
