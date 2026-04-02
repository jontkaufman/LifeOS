import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  LayoutDashboard, User, Target, MessageSquare,
  ClipboardList, Settings, Compass, Sparkles, Calendar,
} from 'lucide-react';

const baseNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'Coach Chat' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/reviews', icon: ClipboardList, label: 'Reviews' },
];

const bottomNavItems = [
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/coaching', icon: Sparkles, label: 'Coaching Style' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    api.get<{ connected: boolean }>('/calendar/status')
      .then(res => setCalendarConnected(res.connected))
      .catch(() => {});
  }, []);

  const navItems = [
    ...baseNavItems,
    ...(calendarConnected ? [{ path: '/calendar', icon: Calendar, label: 'Calendar' }] : []),
    ...bottomNavItems,
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 text-sidebar-foreground">
          <Compass className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold" style={{ fontFamily: 'DM Serif Display, serif' }}>
            LifeOS
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-primary font-medium'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground text-center">
        LifeOS v1.0
      </div>
    </aside>
  );
}
