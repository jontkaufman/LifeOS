import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  description: string | null;
  success_criteria: string;
  is_completed: boolean;
  target_date: string | null;
  sort_order: number;
  completed_at: string | null;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  life_area_id: number;
  goal_type: string;
  purpose_why: string;
  identity_statement: string | null;
  commitment_level: number;
  estimated_weekly_hours: number | null;
  priority: string;
  status: string;
  progress: number;
  target_date: string | null;
  review_cadence: string;
  abandon_reason: string | null;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export function useGoals(filters?: { status?: string; life_area_id?: number }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.life_area_id) params.set('life_area_id', String(filters.life_area_id));
      const qs = params.toString();
      const result = await api.get<Goal[]>(`/goals${qs ? `?${qs}` : ''}`);
      setGoals(result);
    } catch (e) {
      console.error('Failed to load goals:', e);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.life_area_id]);

  useEffect(() => { refresh(); }, [refresh]);

  const createGoal = async (data: Partial<Goal>) => {
    const result = await api.post<{ id: number }>('/goals', data);
    await refresh();
    return result.id;
  };

  const updateGoal = async (id: number, updates: Partial<Goal>) => {
    await api.put(`/goals/${id}`, updates);
    await refresh();
  };

  const deleteGoal = async (id: number) => {
    await api.delete(`/goals/${id}`);
    await refresh();
  };

  const addMilestone = async (goalId: number, data: Partial<Milestone>) => {
    await api.post(`/goals/${goalId}/milestones`, data);
    await refresh();
  };

  const updateMilestone = async (goalId: number, milestoneId: number, updates: Partial<Milestone>) => {
    await api.put(`/goals/${goalId}/milestones/${milestoneId}`, updates);
    await refresh();
  };

  const deleteMilestone = async (goalId: number, milestoneId: number) => {
    await api.delete(`/goals/${goalId}/milestones/${milestoneId}`);
    await refresh();
  };

  return { goals, loading, refresh, createGoal, updateGoal, deleteGoal, addMilestone, updateMilestone, deleteMilestone };
}

export type { Goal, Milestone };
