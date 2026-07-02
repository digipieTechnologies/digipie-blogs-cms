import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocation, Link } from 'react-router-dom';
import { Menu, LayoutDashboard, FileText, FolderTree, Settings as SettingsIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Blogs", href: "/blogs", icon: FileText },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function TopNav() {
  const location = useLocation();
  const [blogsCount, setBlogsCount] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className="flex h-16 items-center gap-4 border-b border-border/50 bg-background/50 px-4 md:px-6 backdrop-blur-xl shrink-0">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center px-6 border-b border-border/50">
            <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
              <div className="">
                <img src="/digipie_logo.png" alt="" className="w-6 h-auto" />
              </div>
              BlogCMS
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="grid gap-1 px-4 text-sm font-medium">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                      isActive
                        ? "bg-accent/50 text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2 truncate">
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
