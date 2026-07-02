import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocation } from 'react-router-dom';

export function TopNav() {
  const location = useLocation();
  const [blogsCount, setBlogsCount] = useState<number | null>(null);

  useEffect(() => {
    const handleCount = (e: Event) => {
      const customEvent = e as CustomEvent;
      setBlogsCount(customEvent.detail);
    };

    window.addEventListener('blogs-count-updated', handleCount);

    if (location.pathname === '/blogs') {
      import('@/lib/db').then(({ db }) => {
        db.getBlogs().then(blogs => setBlogsCount(blogs.length));
      });
    } else {
      setBlogsCount(null);
    }

    return () => window.removeEventListener('blogs-count-updated', handleCount);
  }, [location.pathname]);
  
  // Very basic title generation from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/blogs/new')) return 'Create Blog';
    if (path.startsWith('/blogs/preview')) return 'Preview Blog';
    if (path.startsWith('/blogs/')) return 'Edit Blog';
    if (path.startsWith('/blogs')) return 'Blogs';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Overview';
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/50 bg-background/50 px-6 backdrop-blur-xl shrink-0">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {getPageTitle()}
          {location.pathname === '/blogs' && blogsCount !== null && (
            <span className="text-sm font-normal text-muted-foreground bg-muted/65 px-2 py-0.5 rounded-full border border-border/20">
              {blogsCount} total
            </span>
          )}
        </h1>
        <div className="ml-auto flex items-center space-x-4">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search anything..."
              className="w-full appearance-none bg-background pl-8 shadow-none h-9 rounded-full border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>
          <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-background"></span>
          </button>
          <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border/50 hover:ring-border transition-all">
            <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
