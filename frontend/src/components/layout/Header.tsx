import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/chat': 'Coach Chat',
  '/goals': 'Goals',
  '/reviews': 'Weekly Review',
  '/profile': 'Profile',
  '/coaching': 'Coaching Style',
  '/settings': 'Settings',
  '/onboarding': 'Welcome to LifeOS',
};

export function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'LifeOS';

  return (
    <header className="h-16 border-b border-border flex items-center px-6">
      <h1 className="text-2xl">{title}</h1>
    </header>
  );
}
