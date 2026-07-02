import { useEffect, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/types";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";

export function Categories() {
  const [search, setSearch] = useState("");
  const { data: categories = [], isLoading: loading } = useCategories();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");

  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const slugVal =
      newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    createCategoryMutation.mutate(
      { name: newCatName.trim(), slug: slugVal },
      {
        onSuccess: () => {
          toast.success("Category created successfully");
          setCreateModalOpen(false);
          setNewCatName("");
          setNewCatSlug("");
        },
        onError: () => {
          toast.error("Failed to create category");
        },
      },
    );
  };

  const handleUpdateCategory = async () => {
    if (!editCategory) return;
    if (!editCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const slugVal = editCatSlug.trim() || editCategory.slug;

    updateCategoryMutation.mutate(
      {
        id: editCategory.id,
        category: { name: editCatName.trim(), slug: slugVal },
      },
      {
        onSuccess: () => {
          toast.success("Category updated successfully");
          setEditCategory(null);
        },
        onError: () => {
          toast.error("Failed to update category");
        },
      },
    );
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    deleteCategoryMutation.mutate(deleteCategoryId, {
      onSuccess: () => {
        toast.success("Category deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete category");
      },
      onSettled: () => {
        setDeleteCategoryId(null);
      },
    });
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
        <div className="flex justify-end gap-2 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
            onClick={() => {
              setEditCategory(cat);
              setEditCatName(cat.name);
              setEditCatSlug(cat.slug);
            }}
          >
            <span>
              <Edit className="h-4 w-4" />
            </span>
          </Button>
          {!(cat.totalBlogs > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
              onClick={() => setDeleteCategoryId(cat.id)}
            >
              <span>
                <Trash className="h-4 w-4" />
              </span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your content with topics.
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-2 shadow-sm"
        >
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

      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        loadingMessage="Loading categories..."
        emptyMessage="No categories found."
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Category"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={createCategoryMutation.isPending}
              className="gap-2"
            >
              {createCategoryMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Category Name
            </label>
            <Input
              placeholder="e.g. Tutorials"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground font-normal">
              Slug (optional)
            </label>
            <Input
              placeholder="e.g. tutorials"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editCategory}
        onClose={() => setEditCategory(null)}
        title="Edit Category"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditCategory(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending}
              className="gap-2"
            >
              {updateCategoryMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Category Name
            </label>
            <Input
              placeholder="e.g. Tutorials"
              value={editCatName}
              onChange={(e) => setEditCatName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Slug</label>
            <Input
              placeholder="e.g. tutorials"
              value={editCatSlug}
              onChange={(e) => setEditCatSlug(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteCategoryId}
        onClose={() => setDeleteCategoryId(null)}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteCategoryId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
              className="gap-2"
            >
              {deleteCategoryMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        }
      />
    </div>
  );
}
