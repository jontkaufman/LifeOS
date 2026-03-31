import { useState } from 'react';
import { useCoaching, type CoachingStyle } from '@/hooks/useCoaching';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Plus, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { selectHandler, sliderHandler } from '@/lib/ui-helpers';

const PARAM_LABELS: Record<string, { label: string; low: string; high: string }> = {
  challenge_vs_support: { label: 'Challenge vs Support', low: 'Supportive', high: 'Challenging' },
  tactical_specificity: { label: 'Tactical Specificity', low: 'Big Picture', high: 'Specific Steps' },
  emotional_depth: { label: 'Emotional Depth', low: 'Practical', high: 'Deep Exploration' },
  accountability_intensity: { label: 'Accountability', low: 'Gentle', high: 'No Excuses' },
  formality: { label: 'Formality', low: 'Casual', high: 'Professional' },
  humor: { label: 'Humor', low: 'Serious', high: 'Playful' },
  pace: { label: 'Pace', low: 'Reflective', high: 'Action-Oriented' },
  spirituality: { label: 'Spirituality', low: 'Evidence-Based', high: 'Spiritual' },
};

const PARAM_KEYS = Object.keys(PARAM_LABELS);

export default function Coaching() {
  const {
    styles, blends, active, loading,
    activateStyle, createStyle, updateStyle, deleteStyle,
    generatePersona, activateBlend, createBlend,
  } = useCoaching();

  const [showCustom, setShowCustom] = useState(false);
  const [personaName, setPersonaName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [customStyle, setCustomStyle] = useState<Partial<CoachingStyle>>({
    name: '', description: '',
    challenge_vs_support: 5, tactical_specificity: 5, emotional_depth: 5,
    accountability_intensity: 5, formality: 5, humor: 5, pace: 5, spirituality: 5,
    communication_style: 'mixed', time_orientation: 'balanced',
  });

  if (loading) return <div className="text-muted-foreground">Loading coaching styles...</div>;

  const presets = styles.filter(s => s.is_preset);
  const custom = styles.filter(s => !s.is_preset);

  const handleGenerate = async () => {
    if (!personaName.trim()) return;
    setGenerating(true);
    try {
      const params = await generatePersona(personaName.trim());
      if (!('error' in params)) {
        setCustomStyle(prev => ({
          ...prev,
          name: `${personaName}-Inspired`,
          base_person: personaName,
          description: (params.description as string) || '',
          ...Object.fromEntries(
            PARAM_KEYS.filter(k => k in params).map(k => [k, params[k]])
          ),
          communication_style: (params.communication_style as string) || 'mixed',
          time_orientation: (params.time_orientation as string) || 'balanced',
        }));
      }
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const handleSaveCustom = async () => {
    await createStyle(customStyle);
    setShowCustom(false);
    setCustomStyle({
      name: '', description: '',
      challenge_vs_support: 5, tactical_specificity: 5, emotional_depth: 5,
      accountability_intensity: 5, formality: 5, humor: 5, pace: 5, spirituality: 5,
      communication_style: 'mixed', time_orientation: 'balanced',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Active Style Banner */}
      {active.type !== 'none' && active.data && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm">
              Active: <strong>{'name' in active.data ? active.data.name : ''}</strong>
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="presets">
        <TabsList>
          <TabsTrigger value="presets">Preset Styles</TabsTrigger>
          <TabsTrigger value="custom">Custom Styles</TabsTrigger>
          <TabsTrigger value="blends">Blends</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map(style => (
              <StyleCard
                key={style.id}
                style={style}
                isActive={!!(active.type === 'style' && active.data && 'id' in active.data && active.data.id === style.id)}
                onActivate={() => activateStyle(style.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-4 space-y-4">
          {/* AI Persona Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5" /> AI Persona Generator
              </CardTitle>
              <CardDescription>Enter any person's name and AI will generate coaching style parameters inspired by them.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={personaName}
                  onChange={e => setPersonaName(e.target.value)}
                  placeholder="e.g., Mel Robbins, Simon Sinek, Oprah..."
                />
                <Button onClick={handleGenerate} disabled={generating || !personaName.trim()}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Style Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {customStyle.name ? `Editing: ${customStyle.name}` : 'Create Custom Style'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={customStyle.name || ''}
                    onChange={e => setCustomStyle(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Custom Coach"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={customStyle.description || ''}
                    onChange={e => setCustomStyle(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              {PARAM_KEYS.map(key => {
                const config = PARAM_LABELS[key];
                const value = (customStyle as Record<string, number>)[key] || 5;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{config.label}: {value}/10</span>
                      <span className="text-muted-foreground text-xs">{config.low} → {config.high}</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={sliderHandler(v => setCustomStyle(prev => ({ ...prev, [key]: v })))}
                      min={1} max={10} step={1}
                    />
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Communication Style</Label>
                  <Select
                    value={customStyle.communication_style || 'mixed'}
                    onValueChange={selectHandler(v => setCustomStyle(prev => ({ ...prev, communication_style: v })))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="questions">Questions</SelectItem>
                      <SelectItem value="directives">Directives</SelectItem>
                      <SelectItem value="stories">Stories</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Orientation</Label>
                  <Select
                    value={customStyle.time_orientation || 'balanced'}
                    onValueChange={selectHandler(v => setCustomStyle(prev => ({ ...prev, time_orientation: v })))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="past">Past</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="future">Future</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveCustom} disabled={!customStyle.name?.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Save Custom Style
              </Button>
            </CardContent>
          </Card>

          {/* Custom Styles List */}
          {custom.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {custom.map(style => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isActive={!!(active.type === 'style' && active.data && 'id' in active.data && active.data.id === style.id)}
                  onActivate={() => activateStyle(style.id)}
                  onDelete={() => deleteStyle(style.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blends" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Create a blend by combining multiple coaching styles with custom weights.</p>
              <p className="text-sm mt-2">Select styles from the presets or custom tabs, then blend them together.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StyleCard({ style, isActive, onActivate, onDelete }: {
  style: CoachingStyle;
  isActive: boolean;
  onActivate: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={isActive ? 'border-primary/40' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{style.name}</h4>
              {isActive && <Badge className="text-[10px] bg-primary/20 text-primary">Active</Badge>}
              {style.base_person && (
                <Badge variant="outline" className="text-[10px]">{style.base_person}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{style.description}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-1">
            {PARAM_KEYS.map(key => {
              const config = PARAM_LABELS[key];
              const value = (style as unknown as Record<string, number>)[key] || 5;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground">{config.label}</span>
                  <div className="flex-1 bg-accent rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${value * 10}%` }} />
                  </div>
                  <span className="font-mono w-6 text-right">{value}</span>
                </div>
              );
            })}
            <div className="flex gap-2 text-xs mt-2">
              <Badge variant="outline">{style.communication_style}</Badge>
              <Badge variant="outline">{style.time_orientation}</Badge>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="text-xs">
            {expanded ? 'Less' : 'Details'}
          </Button>
          <div className="flex-1" />
          {onDelete && (
            <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={onDelete}>
              Delete
            </Button>
          )}
          {!isActive && (
            <Button size="sm" onClick={onActivate} className="text-xs">
              Activate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
