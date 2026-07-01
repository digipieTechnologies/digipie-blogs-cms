import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, MoreHorizontal, Filter, ArrowUpDown, Edit, Copy, Trash, Eye, Globe } from 'lucide-react';
import { mockBlogs, mockCategories } from '@/data/mock';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export function BlogsList() {
  const [search, setSearch] = useState('');

  const filteredBlogs = mockBlogs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Blogs</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your content, drafts, and publications.</p>
        </div>
        <Button asChild className="gap-2 shadow-sm">
          <Link to="/blogs/new">
            <Plus className="h-4 w-4" />
            New Blog
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search blogs..."
            className="pl-8 bg-background border-border/60"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background">
            <Filter className="h-4 w-4" />
            Category
          </Button>
          <Button variant="outline" className="gap-2 bg-background">
            <Filter className="h-4 w-4" />
            Status
          </Button>
          <Button variant="outline" className="gap-2 bg-background">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden subtle-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Post</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                        <img src={blog.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors cursor-pointer">
                          {blog.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{blog.readingTime} read</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border/50">
                      {blog.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                      blog.status === 'published' ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      blog.status === 'draft' ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400" :
                      "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400"
                    )}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                        <Link to={`/blogs/${blog.id}`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                         <Link to={`/blogs/preview/${blog.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Globe className="mr-2 h-4 w-4" /> Publish
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBlogs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No blogs found matching your search.
          </div>
        )}
      </Card>
    </div>
  );
}
