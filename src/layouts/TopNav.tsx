import { useState, useEffect } from 'react';
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
          <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border/50 hover:ring-border transition-all">
            <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
