import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CoachingStyle {
  id: number;
  name: string;
  description: string;
  base_person: string | null;
  is_preset: boolean;
  is_active: boolean;
  challenge_vs_support: number;
  tactical_specificity: number;
  emotional_depth: number;
  accountability_intensity: number;
  formality: number;
  humor: number;
  pace: number;
  spirituality: number;
  communication_style: string;
  time_orientation: string;
  custom_system_prompt: string | null;
}

interface CoachingBlend {
  id: number;
  name: string;
  is_active: boolean;
  components: { style_id: number; weight: number }[];
}

interface ActiveCoaching {
  type: 'style' | 'blend' | 'none';
  data: CoachingStyle | { id: number; name: string } | null;
}

export function useCoaching() {
  const [styles, setStyles] = useState<CoachingStyle[]>([]);
  const [blends, setBlends] = useState<CoachingBlend[]>([]);
  const [active, setActive] = useState<ActiveCoaching>({ type: 'none', data: null });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, b, a] = await Promise.all([
        api.get<CoachingStyle[]>('/coaching/styles'),
        api.get<CoachingBlend[]>('/coaching/blends'),
        api.get<ActiveCoaching>('/coaching/active'),
      ]);
      setStyles(s);
      setBlends(b);
      setActive(a);
    } catch (e) {
      console.error('Failed to load coaching data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const activateStyle = async (id: number) => {
    await api.put(`/coaching/styles/${id}/activate`);
    await refresh();
  };

  const createStyle = async (data: Partial<CoachingStyle>) => {
    await api.post('/coaching/styles', data);
    await refresh();
  };

  const updateStyle = async (id: number, data: Partial<CoachingStyle>) => {
    await api.put(`/coaching/styles/${id}`, data);
    await refresh();
  };

  const deleteStyle = async (id: number) => {
    await api.delete(`/coaching/styles/${id}`);
    await refresh();
  };

  const generatePersona = async (personName: string) => {
    return api.post<Record<string, unknown>>('/coaching/generate-persona', { person_name: personName });
  };

  const activateBlend = async (id: number) => {
    await api.put(`/coaching/blends/${id}/activate`);
    await refresh();
  };

  const createBlend = async (data: { name: string; components: { style_id: number; weight: number }[] }) => {
    await api.post('/coaching/blends', data);
    await refresh();
  };

  return {
    styles, blends, active, loading, refresh,
    activateStyle, createStyle, updateStyle, deleteStyle,
    generatePersona, activateBlend, createBlend,
  };
}

export type { CoachingStyle, CoachingBlend, ActiveCoaching };
