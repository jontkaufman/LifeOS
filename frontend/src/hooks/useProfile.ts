import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface LifeArea {
  id: number;
  key: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  current_state: string;
  importance: number;
  satisfaction: number;
  review_cadence: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
}

interface Profile {
  id: number;
  name: string;
  preferred_name: string | null;
  pronouns: string | null;
  life_vision: string;
  core_values: string;
  current_context: string;
  strengths: string;
  growth_edges: string;
  personality_data: string;
  stage_of_change: string;
}

interface CoachingIntake {
  biggest_stressor: string;
  past_coaching_experience: string;
  support_system: string;
  sleep_quality: number;
  sleep_hours: number;
  exercise_frequency: number;
  energy_pattern: string;
  energy_peaks: string;
}

interface ProfileData {
  profile: Profile;
  intake: CoachingIntake;
  life_areas: LifeArea[];
}

function useDebouncedSave() {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const save = useCallback((key: string, fn: () => Promise<void>, delay = 500) => {
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(key, setTimeout(() => {
      fn();
      timers.current.delete(key);
    }, delay));
  }, []);

  useEffect(() => {
    return () => { timers.current.forEach(t => clearTimeout(t)); };
  }, []);

  return save;
}

export function useProfile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const debouncedSave = useDebouncedSave();

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<ProfileData>('/profile');
      setData(result);
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateProfile = (updates: Partial<Profile>) => {
    setData(prev => prev ? { ...prev, profile: { ...prev.profile, ...updates } } : prev);
    debouncedSave(`profile`, () => api.put('/profile', updates));
  };

  const updateLifeArea = (id: number, updates: Partial<LifeArea>) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        life_areas: prev.life_areas.map(a => a.id === id ? { ...a, ...updates } : a),
      };
    });
    debouncedSave(`life-area-${id}`, () => api.put(`/profile/life-areas/${id}`, updates));
  };

  const updateIntake = (updates: Partial<CoachingIntake>) => {
    setData(prev => prev ? { ...prev, intake: { ...prev.intake, ...updates } } : prev);
    debouncedSave(`intake`, () => api.put('/profile/coaching-intake', updates));
  };

  return { data, loading, refresh, updateProfile, updateLifeArea, updateIntake };
}

export type { LifeArea, Profile, CoachingIntake, ProfileData };
