import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderTree, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn, getBlogImageUrl } from "@/lib/utils";
import { useBlogs } from "@/hooks/useBlogs";
import { useCategories } from "@/hooks/useCategories";

export function Dashboard() {
  const { data: blogs = [], isLoading: blogsLoading } = useBlogs();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const loading = blogsLoading || categoriesLoading;
  const categoryCount = categories.length;

  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const draftCount = blogs.filter((b) => b.status === "draft").length;

  return (
    <div className="p-4 md:p-8 mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your content today.
          </p>
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="h-5 w-8 block bg-muted animate-pulse rounded" />
              ) : (
                blogs.length
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active documents
            </p>
          </CardContent>
        </Card>
        <Card className="subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="h-5 w-8 block bg-muted animate-pulse rounded" />
              ) : (
                publishedCount
              )}
            </div>
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
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="h-5 w-8 block bg-muted animate-pulse rounded" />
              ) : (
                draftCount
              )}
            </div>
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
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="h-5 w-8 block bg-muted animate-pulse rounded" />
              ) : (
                categoryCount
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active topics</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 subtle-shadow border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Recent Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-4 animate-pulse">
                      <div className="w-16 h-12 rounded bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-2 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : blogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blogs found.
                </p>
              ) : (
                blogs.slice(0, 5).map((blog) => (
                  <Link 
                    to={`/blogs/preview/${blog.id}`}
                    key={blog.id} 
                    className="flex items-center group p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-12 rounded overflow-hidden mr-4 border border-border/50 shrink-0 relative">
                      <img
                        src={getBlogImageUrl(blog.coverImage)}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">
                        {blog.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {blog.category} ·{" "}
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                          blog.status === "published"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : blog.status === "draft"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400",
                        )}
                      >
                        {blog.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
