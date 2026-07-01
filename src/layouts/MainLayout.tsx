import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-background/50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
