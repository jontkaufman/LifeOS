import { useState, useEffect, useCallback } from 'react';
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

export function useProfile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const updateProfile = async (updates: Partial<Profile>) => {
    await api.put('/profile', updates);
    await refresh();
  };

  const updateLifeArea = async (id: number, updates: Partial<LifeArea>) => {
    await api.put(`/profile/life-areas/${id}`, updates);
    await refresh();
  };

  const updateIntake = async (updates: Partial<CoachingIntake>) => {
    await api.put('/profile/coaching-intake', updates);
    await refresh();
  };

  return { data, loading, refresh, updateProfile, updateLifeArea, updateIntake };
}

export type { LifeArea, Profile, CoachingIntake, ProfileData };
