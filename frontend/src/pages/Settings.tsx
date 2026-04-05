import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Eye, EyeOff, Download, Upload, Loader2, Calendar } from 'lucide-react';
import { selectHandler, sliderHandler } from '@/lib/ui-helpers';

interface Settings {
  active_provider: string;
  active_model: string;
  ollama_base_url: string;
  theme: string;
  accent_color: string;
  font_size: string;
  onboarding_completed: boolean;
  context_max_tokens: number;
  ai_temperature: number;
}

interface ConfiguredProvider {
  provider: string;
  configured: boolean;
}

interface CalendarStatus {
  credentials_configured: boolean;
  connected: boolean;
}

const MODEL_OPTIONS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20250714'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1'],
  ollama: ['llama3.1', 'llama3.2', 'mistral', 'mixtral', 'codellama', 'phi3'],
};

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [providers, setProviders] = useState<ConfiguredProvider[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [keyProvider, setKeyProvider] = useState('anthropic');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [coachingNotes, setCoachingNotes] = useState<Array<{ id: number; note_type: string; content: string; source_type: string }>>([]);

  // Calendar state
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [savingCreds, setSavingCreds] = useState(false);

  // Check for google=connected URL param
  const [defaultTab, setDefaultTab] = useState('api');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'integrations') {
      setDefaultTab('integrations');
    }
    if (params.get('google') === 'connected' || params.get('google') === 'error') {
      setDefaultTab('integrations');
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadProviders();
    loadCoachingNotes();
    loadCalendarStatus();
  }, []);

  const loadSettings = async () => {
    const s = await api.get<Settings>('/settings');
    setSettings(s);
  };
  const loadProviders = async () => {
    const p = await api.get<ConfiguredProvider[]>('/settings/api-keys');
    setProviders(p);
  };
  const loadCoachingNotes = async () => {
    try {
      const n = await api.get<Array<{ id: number; note_type: string; content: string; source_type: string }>>('/coaching/notes');
      setCoachingNotes(n);
    } catch { /* ok */ }
  };
  const loadCalendarStatus = async () => {
    try {
      const s = await api.get<CalendarStatus>('/calendar/status');
      setCalendarStatus(s);
    } catch { /* ok */ }
  };

  const saveApiKey = async () => {
    await api.post('/settings/api-key', { provider: keyProvider, key: apiKey });
    setApiKey('');
    loadProviders();
  };

  const testApiKey = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await api.post<{ valid: boolean; error?: string }>('/settings/api-key/test', {
      provider: keyProvider,
      key: apiKey || undefined,
    });
    setTestResult(result);
    setTesting(false);
  };

  const removeApiKey = async (provider: string) => {
    await api.delete(`/settings/api-key/${provider}`);
    loadProviders();
  };

  const updateSetting = async (key: string, value: unknown) => {
    await api.put('/settings', { [key]: value });
    loadSettings();
  };

  const exportData = async () => {
    const res = await fetch('/api/data/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifeos-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.upload('/data/import', file);
    window.location.reload();
  };

  const saveGoogleCredentials = async (clientId: string, clientSecret: string) => {
    setSavingCreds(true);
    await api.post('/calendar/credentials', { client_id: clientId, client_secret: clientSecret });
    setSavingCreds(false);
    loadCalendarStatus();
  };

  const connectGoogle = async () => {
    const origin = encodeURIComponent(window.location.origin);
    const result = await api.get<{ url?: string; error?: string }>(`/calendar/auth-url?origin=${origin}`);
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const disconnectGoogle = async () => {
    await api.delete('/calendar/disconnect');
    loadCalendarStatus();
  };

  if (!settings) return <div className="text-muted-foreground">Loading settings...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notes">Coaching Notes</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Configuration</CardTitle>
              <CardDescription>Configure your AI provider API keys. Keys are encrypted and stored locally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={keyProvider} onValueChange={selectHandler(setKeyProvider)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder={keyProvider === 'ollama' ? 'Not needed for Ollama' : `Enter ${keyProvider} API key...`}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    disabled={keyProvider === 'ollama'}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={testApiKey} variant="outline" disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                </Button>
                <Button onClick={saveApiKey} disabled={!apiKey && keyProvider !== 'ollama'}>Save</Button>
              </div>

              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${testResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {testResult.valid ? 'Connection successful!' : testResult.error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Configured Providers</Label>
                {providers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {providers.map(p => (
                      <Badge key={p.provider} variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                        {p.provider}
                        <button onClick={() => removeApiKey(p.provider)} className="ml-1 text-muted-foreground hover:text-destructive">
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No API keys configured yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Get API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Anthropic (Claude)</p>
                <p>Visit console.anthropic.com → API Keys → Create Key</p>
              </div>
              <div>
                <p className="font-medium text-foreground">OpenAI (GPT)</p>
                <p>Visit platform.openai.com → API Keys → Create new secret key</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Ollama (Local)</p>
                <p>Install from ollama.ai, run `ollama serve`, then pull a model like `ollama pull llama3.1`</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider & Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Active Provider</Label>
                  <Select value={settings.active_provider} onValueChange={selectHandler(v => updateSetting('active_provider', v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model</Label>
                  <Select value={settings.active_model} onValueChange={selectHandler(v => updateSetting('active_model', v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(MODEL_OPTIONS[settings.active_provider] || []).map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {settings.active_provider === 'ollama' && (
                <div>
                  <Label>Ollama Base URL</Label>
                  <Input
                    value={settings.ollama_base_url}
                    onChange={e => updateSetting('ollama_base_url', e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label>Temperature: {settings.ai_temperature}</Label>
                <Slider
                  value={[settings.ai_temperature]}
                  onValueChange={sliderHandler(v => updateSetting('ai_temperature', v))}
                  min={0} max={1} step={0.1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
              </div>

              <div>
                <Label>Context Window: {settings.context_max_tokens} tokens</Label>
                <Slider
                  value={[settings.context_max_tokens]}
                  onValueChange={sliderHandler(v => updateSetting('context_max_tokens', v))}
                  min={1000} max={16000} step={500}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                <div>
                  <CardTitle>Google Calendar</CardTitle>
                  <CardDescription>Connect your Google Calendar to see upcoming events on your dashboard.</CardDescription>
                </div>
                <div className="ml-auto">
                  {calendarStatus?.connected ? (
                    <Badge className="bg-green-500/10 text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {calendarStatus?.connected ? (
                <Button variant="outline" onClick={disconnectGoogle} className="text-destructive hover:text-destructive">
                  Disconnect
                </Button>
              ) : calendarStatus?.credentials_configured ? (
                <Button onClick={connectGoogle} size="lg">
                  <Calendar className="h-4 w-4 mr-2" /> Sign in with Google
                </Button>
              ) : (
                <GoogleCalendarSetup
                  onSave={saveGoogleCredentials}
                  saving={savingCreds}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Notes</CardTitle>
              <CardDescription>Your AI coach generates these notes to maintain continuity across sessions. You can view and edit them for full transparency.</CardDescription>
            </CardHeader>
            <CardContent>
              {coachingNotes.length > 0 ? (
                <div className="space-y-3">
                  {coachingNotes.map(note => (
                    <div key={note.id} className="p-3 bg-accent rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{note.note_type}</Badge>
                        <span className="text-xs text-muted-foreground">from {note.source_type}</span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No coaching notes yet. They'll be generated after coaching sessions.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or import your LifeOS data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Export Data
                </Button>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" /> Import Data
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Export creates a complete JSON backup of all your data. Import will overwrite existing data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoogleCalendarSetup({ onSave, saving }: { onSave: (clientId: string, clientSecret: string) => Promise<void>; saving: boolean }) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        To connect Google Calendar, you need to set up OAuth credentials first. You can either set <code className="text-xs bg-background px-1 py-0.5 rounded">GOOGLE_CLIENT_ID</code> and <code className="text-xs bg-background px-1 py-0.5 rounded">GOOGLE_CLIENT_SECRET</code> environment variables, or enter them below.
      </p>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Client ID</Label>
          <Input
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="your-app.apps.googleusercontent.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Client Secret</Label>
          <Input
            type="password"
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            placeholder="GOCSPX-..."
            className="mt-1"
          />
        </div>
        <Button
          onClick={() => onSave(clientId, clientSecret)}
          disabled={!clientId.trim() || !clientSecret.trim() || saving}
        >
          Save & Continue
        </Button>
      </div>
      <div className="p-3 bg-accent rounded-lg text-sm space-y-2">
        <p className="font-medium">Setup Instructions</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Go to console.cloud.google.com and create a project</li>
          <li>Enable the Google Calendar API</li>
          <li>Go to Credentials → Create Credentials → OAuth client ID</li>
          <li>Application type: Web application</li>
          <li>Add authorized redirect URI: <code className="text-xs bg-background px-1 py-0.5 rounded">http://&lt;YOUR_IP_OR_DOMAIN&gt;:{window.location.port || '80'}/api/calendar/oauth/callback</code></li>
          <li>Copy the Client ID and Client Secret above</li>
        </ol>
      </div>
    </div>
  );
}
