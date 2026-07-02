import { useEffect, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash, Loader2 } from "lucide-react";

import type { Tag } from "@/types";
import {
  useTags,
  useCreateTagDetailed,
  useUpdateTag,
  useDeleteTag,
} from "@/hooks/useTags";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";

export function Tags() {
  const [search, setSearch] = useState("");
  const { data: tags = [], isLoading: loading } = useTags();

  const createTagMutation = useCreateTagDetailed();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");

  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagSlug, setEditTagSlug] = useState("");

  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    const slugVal =
      newTagSlug.trim() || newTagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    createTagMutation.mutate(
      { name: newTagName.trim(), slug: slugVal },
      {
        onSuccess: () => {
          toast.success("Tag created successfully");
          setCreateModalOpen(false);
          setNewTagName("");
          setNewTagSlug("");
        },
        onError: () => {
          toast.error("Failed to create tag");
        },
      },
    );
  };

  const handleUpdateTag = async () => {
    if (!editTag) return;
    if (!editTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    const slugVal = editTagSlug.trim() || editTag.slug;

    updateTagMutation.mutate(
      {
        id: editTag.id,
        tag: { name: editTagName.trim(), slug: slugVal },
      },
      {
        onSuccess: () => {
          toast.success("Tag updated successfully");
          setEditTag(null);
        },
        onError: () => {
          toast.error("Failed to update tag");
        },
      },
    );
  };

  const handleDeleteTag = async () => {
    if (!deleteTagId) return;
    deleteTagMutation.mutate(deleteTagId, {
      onSuccess: () => {
        toast.success("Tag deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete tag");
      },
      onSettled: () => {
        setDeleteTagId(null);
      },
    });
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnDef<Tag>[] = [
    {
      header: "Name",
      cellClassName: "font-medium",
      cell: (tag) => tag.name,
    },
    {
      header: "Slug",
      cellClassName: "text-muted-foreground font-mono text-xs",
      cell: (tag) => tag.slug,
    },
    {
      header: "Blogs",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (tag) => (
        <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full h-6 min-w-[24px] px-2 text-xs font-semibold">
          {tag.totalBlogs}
        </span>
      ),
    },
    {
      header: "Created",
      cellClassName: "text-muted-foreground",
      cell: (tag) => new Date(tag.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (tag) => (
        <div className="flex justify-end gap-2 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditTag(tag);
              setEditTagName(tag.name);
              setEditTagSlug(tag.slug);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!(tag.totalBlogs > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setDeleteTagId(tag.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tags</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tags to describe and link your content.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-background border-border/60 w-full"
            />
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="gap-2 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTags}
        loading={loading}
        loadingMessage="Loading tags..."
        emptyMessage="No tags found."
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Tag"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={createTagMutation.isPending}
              className="gap-2"
            >
              {createTagMutation.isPending && (
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
              Tag Name
            </label>
            <Input
              placeholder="e.g. React Native"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground font-normal">
              Slug (optional)
            </label>
            <Input
              placeholder="e.g. react-native"
              value={newTagSlug}
              onChange={(e) => setNewTagSlug(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTag}
        onClose={() => setEditTag(null)}
        title="Edit Tag"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditTag(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTag}
              disabled={updateTagMutation.isPending}
              className="gap-2"
            >
              {updateTagMutation.isPending && (
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
              Tag Name
            </label>
            <Input
              placeholder="e.g. React Native"
              value={editTagName}
              onChange={(e) => setEditTagName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Slug</label>
            <Input
              placeholder="e.g. react-native"
              value={editTagSlug}
              onChange={(e) => setEditTagSlug(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTagId}
        onClose={() => setDeleteTagId(null)}
        title="Delete Tag?"
        description="Are you sure you want to delete this tag? This action cannot be undone."
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTagId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={deleteTagMutation.isPending}
              className="gap-2"
            >
              {deleteTagMutation.isPending && (
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
