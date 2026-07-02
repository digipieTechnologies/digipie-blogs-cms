import { useEffect, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
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
import type { Category } from "@/types";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";

export function Categories() {
  const [search, setSearch] = useState("");
  const { data: categories = [], isLoading: loading } = useCategories();
  
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleCreateCategory = async () => {
    const name = prompt("Enter category name:");
    if (!name) return;
    const slug = prompt("Enter category slug (optional):") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    createCategoryMutation.mutate({ name, slug });
  };

  const handleUpdateCategory = async (cat: Category) => {
    const name = prompt("Enter new category name:", cat.name);
    if (!name) return;
    const slug = prompt("Enter new category slug:", cat.slug) || cat.slug;

    updateCategoryMutation.mutate({ id: cat.id, category: { name, slug } });
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnDef<Category>[] = [
    {
      header: "Name",
      cellClassName: "font-medium",
      cell: (cat) => cat.name,
    },
    {
      header: "Slug",
      cellClassName: "text-muted-foreground font-mono text-xs",
      cell: (cat) => cat.slug,
    },
    {
      header: "Blogs",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (cat) => (
        <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full h-6 min-w-[24px] px-2 text-xs font-semibold">
          {cat.totalBlogs}
        </span>
      ),
    },
    {
      header: "Created",
      cellClassName: "text-muted-foreground",
      cell: (cat) => new Date(cat.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (cat) => (
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
            <DropdownMenuItem onClick={() => handleUpdateCategory(cat)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteCategory(cat.id)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        {/* <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your content with topics.
          </p>
        </div> */}

      <div className="flex justify-end items-center gap-4">
        <div className="relative">
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
        <Button onClick={handleCreateCategory} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>


      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        loadingMessage="Loading categories..."
        emptyMessage="No categories found."
      />
    </div>
  );
}
