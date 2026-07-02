import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db";
import type { Category } from "@/types";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await db.getCategories();
      setCategories(data);
    } catch (e) {
      console.error("Failed to load categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async () => {
    const name = prompt("Enter category name:");
    if (!name) return;
    const slug = prompt("Enter category slug (optional):") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    try {
      await db.createCategory({ name, slug });
      loadCategories();
    } catch (e) {
      console.error("Failed to create category:", e);
    }
  };

  const handleUpdateCategory = async (cat: Category) => {
    const name = prompt("Enter new category name:", cat.name);
    if (!name) return;
    const slug = prompt("Enter new category slug:", cat.slug) || cat.slug;

    try {
      await db.updateCategory(cat.id, { name, slug });
      loadCategories();
    } catch (e) {
      console.error("Failed to update category:", e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await db.deleteCategory(id);
        loadCategories();
      } catch (e) {
        console.error("Failed to delete category:", e);
      }
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your content with topics.
          </p>
        </div>
        <Button onClick={handleCreateCategory} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-background border-border/60"
          />
        </div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden subtle-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium text-center">Blogs</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium">{category.name}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full h-6 min-w-[24px] px-2 text-xs font-semibold">
                      {category.totalBlogs}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No categories found.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
