import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface DashboardGoal {
  id: number;
  title: string;
  status: string;
  progress: number;
  life_area_id: number;
  priority: string;
}

interface DashboardReview {
  date: string;
  life_satisfaction: number;
  energy_level: number;
  stress_level: number;
  overall_mood: string;
  is_completed: boolean;
}

interface DashboardAreaScore {
  life_area_id: number;
  score: number;
  previous_score: number | null;
}

interface DashboardLifeArea {
  id: number;
  key: string;
  name: string;
  icon: string;
  color: string;
  importance: number;
  satisfaction: number;
}

interface ActionItem {
  id: number;
  text: string;
  is_completed: boolean;
  due_date: string | null;
}

interface DashboardData {
  goals: DashboardGoal[];
  latest_review: DashboardReview | null;
  area_scores: DashboardAreaScore[];
  life_areas: DashboardLifeArea[];
  action_items: ActionItem[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [coachingMessage, setCoachingMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<DashboardData>('/dashboard');
      setData(result);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const refreshCoachingMessage = async () => {
    try {
      const result = await api.post<{ message: string }>('/dashboard/coaching-message');
      setCoachingMessage(result.message);
    } catch (e) {
      console.error('Failed to load coaching message:', e);
    }
  };

  const toggleActionItem = async (id: number) => {
    await api.put(`/chat/action-items/${id}`);
    await refresh();
  };

  return { data, coachingMessage, loading, refresh, refreshCoachingMessage, toggleActionItem };
}

export type { DashboardData, DashboardGoal, DashboardReview, DashboardAreaScore, DashboardLifeArea, ActionItem };
