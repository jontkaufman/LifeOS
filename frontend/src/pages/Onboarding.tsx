import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Compass, ArrowRight, ArrowLeft, CheckCircle2,
  Eye, EyeOff, Loader2, Sparkles,
} from 'lucide-react';
import { sliderHandler } from '@/lib/ui-helpers';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = ['welcome', 'apikey', 'profile', 'areas', 'complete'] as const;
type Step = typeof STEPS[number];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const navigate = useNavigate();

  const stepIndex = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  const prev = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]);

  const handleComplete = async () => {
    await api.post('/onboarding/complete');
    onComplete();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-primary' : 'bg-accent'
              }`}
            />
          ))}
        </div>

        {step === 'welcome' && <WelcomeStep onNext={next} />}
        {step === 'apikey' && <ApiKeyStep onNext={next} onPrev={prev} />}
        {step === 'profile' && <ProfileStep onNext={next} onPrev={prev} />}
        {step === 'areas' && <AreasStep onNext={next} onPrev={prev} />}
        {step === 'complete' && <CompleteStep onComplete={handleComplete} onPrev={prev} />}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="text-center">
      <CardContent className="p-12">
        <Compass className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Welcome to LifeOS
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Your AI-powered personal coaching platform. Let's set things up so your coach can get to know you.
        </p>
        <Button size="lg" onClick={onNext}>
          Get Started <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ApiKeyStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [provider, setProvider] = useState('anthropic');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    const res = await api.post<{ valid: boolean; error?: string }>('/settings/api-key/test', {
      provider, key: provider === 'ollama' ? undefined : key,
      base_url: provider === 'ollama' ? key || 'http://localhost:11434' : undefined,
    });
    setResult(res);
    setTesting(false);
  };

  const handleSave = async () => {
    if (provider === 'ollama') {
      await api.post('/settings/api-key', { provider: 'ollama', key: 'ollama' });
      if (key) await api.put('/settings', { ollama_base_url: key });
    } else {
      await api.post('/settings/api-key', { provider, key });
    }
    await api.put('/settings', { active_provider: provider });
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your AI</CardTitle>
        <CardDescription>LifeOS needs an AI provider to power your coaching experience. Your API key stays on your machine, encrypted.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>AI Provider</Label>
          <Select value={provider} onValueChange={v => { if (v) { setProvider(v); setResult(null); } }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic (Claude) - Recommended</SelectItem>
              <SelectItem value="openai">OpenAI (GPT)</SelectItem>
              <SelectItem value="ollama">Ollama (Local, Free)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{provider === 'ollama' ? 'Ollama URL (optional)' : 'API Key'}</Label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder={provider === 'ollama' ? 'http://localhost:11434' : `Enter your ${provider} API key`}
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {provider === 'anthropic' && (
          <p className="text-xs text-muted-foreground">Get your key at console.anthropic.com → API Keys → Create Key</p>
        )}
        {provider === 'openai' && (
          <p className="text-xs text-muted-foreground">Get your key at platform.openai.com → API Keys → Create new secret key</p>
        )}
        {provider === 'ollama' && (
          <p className="text-xs text-muted-foreground">Install from ollama.ai, run `ollama serve` and `ollama pull llama3.1`</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing || (!key && provider !== 'ollama')}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Connection
          </Button>
          {result && (
            <div className={`flex items-center gap-1 text-sm ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
              {result.valid ? <CheckCircle2 className="h-4 w-4" /> : null}
              {result.valid ? 'Connected!' : result.error}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <Button onClick={handleSave} disabled={!key && provider !== 'ollama'}>
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [name, setName] = useState('');
  const [vision, setVision] = useState('');
  const [context, setContext] = useState('');

  const handleSave = async () => {
    await api.put('/profile', {
      name, preferred_name: name.split(' ')[0],
      life_vision: vision, current_context: context,
    });
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell Me About Yourself</CardTitle>
        <CardDescription>Help your coach understand who you are.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>What's your name?</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <Label>What does your ideal life look like?</Label>
          <Textarea value={vision} onChange={e => setVision(e.target.value)} placeholder="Describe your vision..." rows={3} />
        </div>
        <div>
          <Label>What's going on in your life right now?</Label>
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Current situation, challenges, opportunities..." rows={3} />
        </div>
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AreasStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [areas, setAreas] = useState<Array<{ id: number; name: string; icon: string; importance: number; satisfaction: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Array<{ id: number; name: string; icon: string; importance: number; satisfaction: number }>>('/profile/life-areas')
      .then(setAreas)
      .finally(() => setLoading(false));
  }, []);

  const updateArea = async (id: number, field: string, value: number) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    await api.put(`/profile/life-areas/${id}`, { [field]: value });
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wheel of Life</CardTitle>
        <CardDescription>Rate the importance of each area and your current satisfaction (1-10).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {areas.map(area => (
          <div key={area.id} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{area.icon}</span> {area.name}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Importance: {area.importance}</Label>
                <Slider
                  value={[area.importance]}
                  onValueChange={sliderHandler(v => updateArea(area.id, 'importance', v))}
                  min={1} max={10} step={1}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Satisfaction: {area.satisfaction}</Label>
                <Slider
                  value={[area.satisfaction]}
                  onValueChange={sliderHandler(v => updateArea(area.id, 'satisfaction', v))}
                  min={1} max={10} step={1}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <Button onClick={onNext}>Continue <ArrowRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteStep({ onComplete, onPrev }: { onComplete: () => void; onPrev: () => void }) {
  return (
    <Card className="text-center">
      <CardContent className="p-12">
        <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h2 className="text-3xl mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
          You're All Set!
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Your coaching environment is ready. Your AI coach will use what you've shared to provide personalized guidance.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="ghost" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <Button size="lg" onClick={onComplete}>
            <Compass className="h-5 w-5 mr-2" /> Enter LifeOS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
