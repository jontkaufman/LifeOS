import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import Goals from '@/pages/Goals';
import Reviews from '@/pages/Reviews';
import Profile from '@/pages/Profile';
import Coaching from '@/pages/Coaching';
import Settings from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';
import { TooltipProvider } from '@/components/ui/tooltip';

const ONBOARDING_KEY = 'lifeos_onboarding_done';

export default function App() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(() => {
    return localStorage.getItem(ONBOARDING_KEY) === '1' ? true : null;
  });

  const markComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setOnboardingCompleted(true);
  };

  useEffect(() => {
    if (onboardingCompleted) return;
    api.get<{ completed: boolean }>('/onboarding/status')
      .then(res => {
        if (res.completed) markComplete();
        else setOnboardingCompleted(false);
      })
      .catch(() => setOnboardingCompleted(false));
  }, []);

  if (onboardingCompleted === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading LifeOS...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/onboarding" element={
            <Onboarding onComplete={markComplete} />
          } />
          {!onboardingCompleted ? (
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          ) : (
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/coaching" element={<Coaching />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}
