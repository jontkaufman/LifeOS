import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar as CalendarIcon, Plus, MapPin, Clock, Trash2, Pencil, X, Check, Loader2,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  all_day: boolean;
  location: string | null;
  description?: string | null;
}

interface EventFormData {
  summary: string;
  start: string;
  end: string;
  description: string;
  location: string;
  all_day: boolean;
}

const emptyForm: EventFormData = {
  summary: '', start: '', end: '', description: '', location: '', all_day: false,
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<CalendarEvent[] | { error: string; events: CalendarEvent[] }>(`/calendar/events?days=${days}`);
      if (Array.isArray(result)) {
        setEvents(result);
      } else if ('events' in result) {
        setEvents(result.events);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [days]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!form.summary || !form.start || !form.end) return;
    setSaving(true);
    try {
      await api.post('/calendar/events', {
        summary: form.summary,
        start: form.all_day ? form.start : toISO(form.start),
        end: form.all_day ? form.end : toISO(form.end),
        description: form.description,
        location: form.location,
        all_day: form.all_day,
      });
      setCreating(false);
      setForm(emptyForm);
      await refresh();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.summary) return;
    setSaving(true);
    try {
      await api.put(`/calendar/events/${editingId}`, {
        summary: form.summary,
        start: form.start ? (form.all_day ? form.start : toISO(form.start)) : undefined,
        end: form.end ? (form.all_day ? form.end : toISO(form.end)) : undefined,
        description: form.description,
        location: form.location,
        all_day: form.all_day,
      });
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (eventId: string) => {
    try {
      await api.delete(`/calendar/events/${eventId}`);
      await refresh();
    } catch { /* ignore */ }
  };

  const startEdit = (event: CalendarEvent) => {
    setCreating(false);
    setEditingId(event.id);
    setForm({
      summary: event.summary,
      start: event.all_day ? event.start : fromISO(event.start),
      end: event.all_day ? event.end : fromISO(event.end),
      description: event.description || '',
      location: event.location || '',
      all_day: event.all_day,
    });
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // Group events by date
  const grouped = groupByDate(events);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" /> Calendar
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="bg-background border border-input rounded-md px-2 py-1.5 text-sm"
          >
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
          </select>
          <Button onClick={() => { setEditingId(null); setCreating(true); setForm(emptyForm); }}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(creating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {creating ? 'New Event' : 'Edit Event'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm
              form={form}
              setForm={setForm}
              onSave={creating ? handleCreate : handleUpdate}
              onCancel={cancelForm}
              saving={saving}
            />
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading events...
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No upcoming events. Create one to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {formatDateHeader(dateKey)}
              </h2>
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <Card key={event.id} className={editingId === event.id ? 'ring-2 ring-primary' : ''}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-1 h-10 bg-primary/60 rounded-full shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{event.summary}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {event.all_day ? 'All day' : formatTimeRange(event.start, event.end)}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {event.all_day && (
                            <Badge variant="secondary" className="text-xs">All Day</Badge>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(event)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventForm({
  form, setForm, onSave, onCancel, saving,
}: {
  form: EventFormData;
  setForm: (f: EventFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input
          value={form.summary}
          onChange={e => setForm({ ...form, summary: e.target.value })}
          placeholder="Event title"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.all_day}
          onChange={e => setForm({ ...form, all_day: e.target.checked })}
          className="rounded"
          id="all-day"
        />
        <label htmlFor="all-day" className="text-sm">All-day event</label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Start</label>
          <Input
            type={form.all_day ? 'date' : 'datetime-local'}
            value={form.start}
            onChange={e => setForm({ ...form, start: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">End</label>
          <Input
            type={form.all_day ? 'date' : 'datetime-local'}
            value={form.end}
            onChange={e => setForm({ ...form, end: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Location</label>
        <Input
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          placeholder="Optional location"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Optional description"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button onClick={onSave} disabled={saving || !form.summary || !form.start || !form.end}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </div>
    </div>
  );
}

// -- Helpers --

function toISO(localDatetime: string): string {
  // datetime-local gives "2025-01-15T09:00" — convert to full ISO with timezone
  try {
    return new Date(localDatetime).toISOString();
  } catch {
    return localDatetime;
  }
}

function fromISO(iso: string): string {
  // Convert ISO string to datetime-local format "YYYY-MM-DDTHH:mm"
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function groupByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const dateKey = event.start.slice(0, 10); // YYYY-MM-DD
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  }
  return grouped;
}

function formatDateHeader(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTimeRange(start: string, end: string): string {
  try {
    const fmt = (s: string) => new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch {
    return start;
  }
}
