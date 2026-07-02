import { useEffect, useState, useRef } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Edit,
  Copy,
  Trash,
  Eye,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getBlogImageUrl } from "@/lib/utils";
import type { Blog } from "@/types";
import { useBlogs, useDeleteBlog } from "@/hooks/useBlogs";
import { useCategories } from "@/hooks/useCategories";

export function BlogsList() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "title-asc" | "title-desc"
  >("date-desc");

  const { data: blogs = [], isLoading: blogsLoading } = useBlogs();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const deleteBlogMutation = useDeleteBlog();

  const loading = blogsLoading || categoriesLoading;

  const handleDeleteBlog = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      deleteBlogMutation.mutate(id);
    }
  };

  const filteredBlogs = blogs
    .filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        b.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" || b.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "date-asc") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
    
  const [visibleCount, setVisibleCount] = useState(10);
  const itemsPerPage = 10;

  useEffect(() => {
    setVisibleCount(10);
  }, [search, selectedCategory, selectedStatus, sortBy]);

  const totalItems = filteredBlogs.length;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('blogs-count-updated', { detail: totalItems }));
  }, [totalItems]);

  const paginatedBlogs = filteredBlogs.slice(0, visibleCount);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= totalItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + itemsPerPage, totalItems));
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, totalItems]);

  const columns: ColumnDef<Blog>[] = [
    {
      header: "Post",
      cellClassName: "w-[40%] max-w-[250px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[550px]",
      cell: (blog) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
            <img
              src={getBlogImageUrl(blog.coverImage)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <Link to={`/blogs/preview/${blog.id}`} className="min-w-0 block">
            <p className="font-medium truncate hover:text-primary transition-colors cursor-pointer">
              {blog.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {blog.readingTime} read
            </p>
          </Link>
        </div>
      ),
    },
    {
      header: "Category",
      cellClassName: "whitespace-nowrap",
      cell: (blog) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border/50">
          {blog.category}
        </span>
      ),
    },
    {
      header: "Status",
      cellClassName: "whitespace-nowrap",
      cell: (blog) => (
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
      ),
    },
    {
      header: "Date",
      cellClassName: "whitespace-nowrap text-muted-foreground",
      cell: (blog) =>
        new Date(blog.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap text-right",
      cell: (blog) => (
        <div className="flex justify-end gap-2 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to={`/blogs/${blog.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to={`/blogs/preview/${blog.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/blogs/${blog.id}`} className="flex items-center w-full">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/blogs/preview/${blog.id}`} className="flex items-center w-full">
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Globe className="mr-2 h-4 w-4" /> Publish
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteBlog(blog.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search blogs..."
              className="pl-8 bg-background border-border/60"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background">
                  <Filter className="h-4 w-4" />
                  {selectedCategory === "all" ? "Category" : selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 max-h-72 overflow-y-auto"
              >
                <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                  All Categories {selectedCategory === "all" && " ✓"}
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.name} {selectedCategory === cat.name && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background">
                  <Filter className="h-4 w-4" />
                  {selectedStatus === "all"
                    ? "Status"
                    : selectedStatus.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                  All Statuses {selectedStatus === "all" && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("published")}>
                  Published {selectedStatus === "published" && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("draft")}>
                  Draft {selectedStatus === "draft" && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("archived")}>
                  Archived {selectedStatus === "archived" && " ✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort:{" "}
                  {sortBy === "date-desc"
                    ? "Newest"
                    : sortBy === "date-asc"
                      ? "Oldest"
                      : sortBy === "title-asc"
                        ? "A-Z"
                        : "Z-A"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                  Newest first {sortBy === "date-desc" && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                  Oldest first {sortBy === "date-asc" && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title-asc")}>
                  Title (A-Z) {sortBy === "title-asc" && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title-desc")}>
                  Title (Z-A) {sortBy === "title-desc" && " ✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Button asChild className="gap-2 shadow-sm shrink-0 h-10 w-full xl:w-auto">
          <Link to="/blogs/new">
            <Plus className="h-4 w-4" />
            New Blog
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedBlogs}
        loading={loading}
        loadingMessage="Loading blogs..."
        emptyMessage="No blogs found matching your search."
        footer={
          <>
            {!loading && visibleCount < totalItems && (
              <div ref={loaderRef} className="p-8 text-center text-muted-foreground flex justify-center items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                Loading more blogs...
              </div>
            )}
            {!loading && visibleCount >= totalItems && totalItems > 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground border-t border-border/50 bg-muted/10">
                End of list. Showing all {totalItems} blogs.
              </div>
            )}
          </>
        }
      />
    </div>
  );
}
