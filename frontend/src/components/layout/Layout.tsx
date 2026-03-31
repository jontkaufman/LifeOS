import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6 h-[calc(100vh-4rem)] overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
