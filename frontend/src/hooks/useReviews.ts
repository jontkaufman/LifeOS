import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface AreaScore {
  id: number;
  review_id: number;
  life_area_id: number;
  score: number;
  previous_score: number | null;
  note: string | null;
}

interface Review {
  id: number;
  review_type: string;
  week_id: string;
  date: string;
  is_completed: boolean;
  gratitude_1: string;
  gratitude_2: string;
  gratitude_3: string;
  wins: string;
  challenges: string;
  avoiding: string;
  unfulfilled_commitments: string;
  lessons: string;
  energy_sources: string;
  energy_drains: string;
  life_satisfaction: number;
  alignment_score: number;
  stress_level: number;
  energy_level: number;
  overall_mood: string;
  next_week_priorities: string;
  support_needed: string;
  ai_analysis: string;
  ai_notes: string;
  area_scores: AreaScore[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [list, curr] = await Promise.all([
        api.get<Review[]>('/reviews'),
        api.get<Review>('/reviews/current'),
      ]);
      setReviews(list);
      setCurrent(curr);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateReview = async (id: number, updates: Partial<Review> & { area_scores?: { life_area_id: number; score: number; note?: string }[] }) => {
    await api.put(`/reviews/${id}`, updates);
    await refresh();
  };

  const completeReview = async (id: number) => {
    await api.post(`/reviews/${id}/complete`);
    await refresh();
  };

  return { reviews, current, loading, refresh, updateReview, completeReview };
}

export type { Review, AreaScore };
