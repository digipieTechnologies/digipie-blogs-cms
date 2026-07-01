import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FolderTree, Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockBlogs, mockCategories } from '@/data/mock';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const publishedCount = mockBlogs.filter(b => b.status === 'published').length;
  const draftCount = mockBlogs.filter(b => b.status === 'draft').length;
  const categoryCount = mockCategories.length;

  return (
    <div className="p-8 mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your content today.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="gap-2">
            <Link to="/blogs/new">
              <Plus className="h-4 w-4" />
              New Blog
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBlogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +20% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Live on production
            </p>
          </CardContent>
        </Card>
        <Card className="subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs your attention
            </p>
          </CardContent>
        </Card>
        <Card className="subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active topics
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockBlogs.slice(0, 5).map(blog => (
                <div key={blog.id} className="flex items-center group">
                  <div className="w-16 h-12 rounded overflow-hidden mr-4 border border-border/50 shrink-0 relative">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors cursor-pointer">
                      {blog.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {blog.category} · {new Date(blog.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                      blog.status === 'published' ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      blog.status === 'draft' ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400" :
                      "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400"
                    )}>
                      {blog.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* <Card className="col-span-3 subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 px-4 py-3 bg-background rounded-lg border border-border/50 subtle-shadow text-sm">
                  <span className="font-medium">Alex</span> published a new blog post
                  <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 px-4 py-3 bg-background rounded-lg border border-border/50 subtle-shadow text-sm">
                  <span className="font-medium">Sarah</span> updated the React guide
                  <div className="text-xs text-muted-foreground mt-1">5 hours ago</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 px-4 py-3 bg-background rounded-lg border border-border/50 subtle-shadow text-sm">
                  System backup completed successfully
                  <div className="text-xs text-muted-foreground mt-1">Yesterday</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
