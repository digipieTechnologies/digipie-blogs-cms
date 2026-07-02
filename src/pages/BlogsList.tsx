import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { db } from "@/lib/db";
import type { Blog } from "@/types";

export function BlogsList() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<
    Array<{ name: string; slug: string }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "title-asc" | "title-desc"
  >("date-desc");

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [blogsData, catsData] = await Promise.all([
          db.getBlogs(),
          db.getCategories(),
        ]);
        setBlogs(blogsData);
        setCategories(catsData);
      } catch (err) {
        console.error("Error loading blogs/categories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteBlog = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      try {
        await db.deleteBlog(id);
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        console.error("Failed to delete blog:", err);
      }
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus, sortBy]);

  const totalItems = filteredBlogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Blogs
            <span className="text-sm font-normal text-muted-foreground bg-muted/65 px-2 py-0.5 rounded-full border border-border/20">
              {totalItems} total
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your content, drafts, and publications.
          </p>
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
              {paginatedBlogs.map((blog) => (
                <tr
                  key={blog.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                        <img
                          src={getBlogImageUrl(blog.coverImage)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors cursor-pointer">
                          {blog.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {blog.readingTime} read
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border/50">
                      {blog.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {new Date(blog.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          <DropdownMenuItem
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
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
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
            Loading blogs...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No blogs found matching your search.
          </div>
        ) : null}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-6 py-4 bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              blogs
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
