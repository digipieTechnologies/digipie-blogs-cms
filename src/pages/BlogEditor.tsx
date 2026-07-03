import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Table,
  Undo,
  Redo,
  LayoutPanelLeft,
  ChevronDown,
  CheckSquare,
  Minus,
  Loader2,
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Trash2,
  Video,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { BlogDetailPreview } from "@/components/BlogDetailPreview";
import { MultiDropdown } from "@/components/ui/MultiDropdown";
import { Modal } from "@/components/ui/modal";
import { useBlog, useCreateBlog, useUpdateBlog } from "@/hooks/useBlogs";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getBlogImageUrl,
  convertContentToHtml,
  convertHtmlToBlocks,
} from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { db } from "@/lib/db";

const formatHtmlString = (html: string): string => {
  let formatted = "";
  let indent = "";
  const tab = "  ";

  // Split by tags
  const tokens = html.split(/(<\/?[^>]+>)/g);

  tokens.forEach((token) => {
    token = token.trim();
    if (!token) return;

    if (token.startsWith("</")) {
      // Closing tag
      indent = indent.slice(tab.length);
      formatted += indent + token + "\n";
    } else if (
      token.startsWith("<") &&
      !token.endsWith("/>") &&
      !token.startsWith("<!") &&
      !token.startsWith("<?")
    ) {
      // Opening tag (excluding self-closing tags and comments/directives)
      const isSelfClosing = /<input|img|br|hr|meta|link/i.test(token);
      formatted += indent + token + "\n";
      if (!isSelfClosing) {
        indent += tab;
      }
    } else {
      // Text content or self-closing tag
      formatted += indent + token + "\n";
    }
  });

  return formatted.trim();
};

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== "new";
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState("Start writing..");
  const [coverImage, setCoverImage] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [category, setCategory] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsString, setTagsString] = useState("");

  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [activeMedia, setActiveMedia] = useState<HTMLElement | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Link Insertion States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Video Insertion States
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState<"youtube" | "file">("youtube");
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [mediaRect, setMediaRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const updateActiveMediaRect = () => {
    if (!activeMedia || !editorRef.current) {
      setMediaRect(null);
      return;
    }
    const editorBounds = editorRef.current.getBoundingClientRect();
    const mediaBounds = activeMedia.getBoundingClientRect();

    setMediaRect({
      top: mediaBounds.top - editorBounds.top + editorRef.current.scrollTop,
      left: mediaBounds.left - editorBounds.left + editorRef.current.scrollLeft,
      width: mediaBounds.width,
      height: mediaBounds.height,
    });
  };

  useEffect(() => {
    if (!activeMedia) return;
    updateActiveMediaRect();

    window.addEventListener("resize", updateActiveMediaRect);
    const editorEl = editorRef.current;
    if (editorEl) {
      editorEl.addEventListener("scroll", updateActiveMediaRect);
    }

    return () => {
      window.removeEventListener("resize", updateActiveMediaRect);
      if (editorEl) {
        editorEl.removeEventListener("scroll", updateActiveMediaRect);
      }
    };
  }, [activeMedia]);

  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [tableRect, setTableRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const updateActiveTableRect = () => {
    if (!activeTable || !editorRef.current) {
      setTableRect(null);
      return;
    }
    const editorBounds = editorRef.current.getBoundingClientRect();
    const tableBounds = activeTable.getBoundingClientRect();

    setTableRect({
      top: tableBounds.top - editorBounds.top + editorRef.current.scrollTop,
      left: tableBounds.left - editorBounds.left + editorRef.current.scrollLeft,
      width: tableBounds.width,
      height: tableBounds.height,
    });
  };

  useEffect(() => {
    if (!activeTable) return;
    updateActiveTableRect();

    window.addEventListener("resize", updateActiveTableRect);
    const editorEl = editorRef.current;
    if (editorEl) {
      editorEl.addEventListener("scroll", updateActiveTableRect);
    }

    return () => {
      window.removeEventListener("resize", updateActiveTableRect);
      if (editorEl) {
        editorEl.removeEventListener("scroll", updateActiveTableRect);
      }
    };
  }, [activeTable]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (editorRef.current && editorRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "IMG" ||
          target.tagName === "VIDEO" ||
          target.tagName === "IFRAME"
        ) {
          setActiveMedia(target);
          setActiveTable(null);
          return;
        }

        const table = target.closest("table");
        if (table) {
          setActiveTable(table);
          setActiveMedia(null);
          return;
        }
      }

      const clickedElement = e.target as HTMLElement;
      if (
        clickedElement.closest(".image-control-overlay") ||
        clickedElement.closest(".table-control-overlay") ||
        clickedElement.tagName === "IMG" ||
        clickedElement.tagName === "VIDEO" ||
        clickedElement.tagName === "IFRAME" ||
        clickedElement.closest("table")
      ) {
        return;
      }

      setActiveMedia(null);
      setActiveTable(null);
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const addRow = (direction: "above" | "below") => {
    if (!activeTable) return;
    const rows = Array.from(activeTable.rows);
    if (rows.length === 0) return;

    const colsCount = rows[0].cells.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colsCount; i++) {
      const cell = document.createElement("td");
      cell.className = "px-4 py-2 text-sm border";
      cell.innerHTML = "New cell";
      newRow.appendChild(cell);
    }

    const tbody = activeTable.querySelector("tbody") || activeTable;
    tbody.appendChild(newRow);

    setTimeout(updateActiveTableRect, 0);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const addColumn = () => {
    if (!activeTable) return;
    const rows = Array.from(activeTable.rows);
    if (rows.length === 0) return;

    rows.forEach((row, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      cell.className =
        index === 0
          ? "px-4 py-2 text-left text-xs font-semibold text-muted-foreground border bg-muted/50"
          : "px-4 py-2 text-sm border";
      cell.innerHTML = index === 0 ? `Col ${row.cells.length + 1}` : "New cell";
      row.appendChild(cell);
    });

    setTimeout(updateActiveTableRect, 0);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const deleteRow = () => {
    if (!activeTable) return;
    const rows = Array.from(activeTable.rows);
    if (rows.length <= 1) {
      activeTable.remove();
      setActiveTable(null);
    } else {
      rows[rows.length - 1].remove();
      setTimeout(updateActiveTableRect, 0);
    }
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const deleteColumn = () => {
    if (!activeTable) return;
    const rows = Array.from(activeTable.rows);
    if (rows.length === 0) return;
    const colsCount = rows[0].cells.length;
    if (colsCount <= 1) {
      activeTable.remove();
      setActiveTable(null);
    } else {
      rows.forEach((row) => {
        if (row.cells.length > 0) {
          row.cells[row.cells.length - 1].remove();
        }
      });
      setTimeout(updateActiveTableRect, 0);
    }
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const moveMedia = (direction: "up" | "down") => {
    if (!activeMedia || !editorRef.current) return;

    let blockNode: HTMLElement | null = activeMedia;
    while (blockNode && blockNode.parentElement !== editorRef.current) {
      blockNode = blockNode.parentElement;
    }

    if (!blockNode) return;

    const parent = editorRef.current;
    if (direction === "up") {
      const prev = blockNode.previousElementSibling;
      if (prev) {
        parent.insertBefore(blockNode, prev);
      }
    } else {
      const next = blockNode.nextElementSibling;
      if (next) {
        parent.insertBefore(blockNode, next.nextElementSibling);
      }
    }

    setTimeout(updateActiveMediaRect, 50);
    setContent(parent.innerHTML);
  };

  const moveTable = (direction: "up" | "down") => {
    if (!activeTable || !editorRef.current) return;

    let blockNode: HTMLElement | null = activeTable;
    while (blockNode && blockNode.parentElement !== editorRef.current) {
      blockNode = blockNode.parentElement;
    }

    if (!blockNode) return;

    const parent = editorRef.current;
    if (direction === "up") {
      const prev = blockNode.previousElementSibling;
      if (prev) {
        parent.insertBefore(blockNode, prev);
      }
    } else {
      const next = blockNode.nextElementSibling;
      if (next) {
        parent.insertBefore(blockNode, next.nextElementSibling);
      }
    }

    setTimeout(updateActiveTableRect, 50);
    setContent(parent.innerHTML);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    direction: "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeMedia) return;

    const startWidth = activeMedia.clientWidth;
    const startHeight = activeMedia.clientHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction === "se") {
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === "sw") {
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === "ne") {
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === "nw") {
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === "e") {
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === "w") {
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (direction === "s") {
        newHeight = startHeight + deltaY;
        newWidth = newHeight * aspectRatio;
      } else if (direction === "n") {
        newHeight = startHeight - deltaY;
        newWidth = newHeight * aspectRatio;
      }

      if (newWidth < 50) {
        newWidth = 50;
        newHeight = newWidth / aspectRatio;
      }
      const maxW = editorRef.current?.clientWidth || 800;
      if (newWidth > maxW) {
        newWidth = maxW;
        newHeight = newWidth / aspectRatio;
      }

      activeMedia.style.width = `${newWidth}px`;
      activeMedia.style.height = `${newHeight}px`;

      updateActiveMediaRect();
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    // Fetch tags from DB
    db.getTags().then((tags) => {
      const merged = Array.from(new Set([...tags]));
      setAvailableTags(merged);
    });
  }, []);

  const handleAddCustomTag = async (tagText: string) => {
    const trimmed = tagText.trim();
    if (!trimmed) return;

    const currentTags = tagsString
      ? tagsString
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    if (!currentTags.includes(trimmed)) {
      // Optimistically add to current selection
      const newTags = [...currentTags, trimmed];
      setTagsString(newTags.join(", "));

      // Add to available tags options
      setAvailableTags((prev) => Array.from(new Set([...prev, trimmed])));

      try {
        const persistedName = await db.createTag(trimmed);
        if (persistedName && persistedName !== trimmed) {
          // Reconcile if DB returned a formatted/fixed name
          const updatedSelection = newTags.map((t) =>
            t === trimmed ? persistedName : t,
          );
          setTagsString(updatedSelection.join(", "));
          setAvailableTags((prev) =>
            Array.from(
              new Set([...prev.filter((t) => t !== trimmed), persistedName]),
            ),
          );
        }
      } catch (err) {
        console.error("Failed to create tag in DB:", err);
      }
    }
  };

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const { data: fetchedBlog, isLoading: blogLoading } = useBlog(
    isEditing ? id : undefined,
  );

  const createBlogMutation = useCreateBlog();
  const updateBlogMutation = useUpdateBlog();
  const createCategoryMutation = useCreateCategory();

  const handleAddCustomCategory = async (catText: string) => {
    const trimmed = catText.trim();
    if (!trimmed) return;

    const currentCats = category
      ? category
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
    if (!currentCats.includes(trimmed)) {
      // Optimistically add to selection
      const newCats = [...currentCats, trimmed];
      setCategory(newCats.join(", "));

      try {
        await createCategoryMutation.mutateAsync({
          name: trimmed,
          slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        });
        toast.success(`Category "${trimmed}" created successfully`);
      } catch (err) {
        console.error("Failed to create category:", err);
        toast.error("Failed to create category");
      }
    }
  };

  const handleUploadImage = async (imageSrc: string): Promise<string> => {
    if (!imageSrc || !imageSrc.startsWith("data:image/")) {
      return imageSrc;
    }

    const isSupabaseConfigured = () => {
      const url = import.meta.env.VITE_SUPABASE_URL || "";
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
      return (
        url &&
        !url.includes("YOUR_SUPABASE_PROJECT_URL") &&
        key &&
        !key.includes("YOUR_SUPABASE_ANON_KEY")
      );
    };

    if (!isSupabaseConfigured()) {
      return imageSrc;
    }

    try {
      const mimeType =
        imageSrc.split(",")[0].match(/:(.*?);/)?.[1] || "image/png";
      const fileExt = mimeType.split("/")[1] || "png";

      let baseName =
        slug.trim() ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      if (!baseName) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0] + "-" + now.getTime();
        baseName = `blog-cover-${dateStr}`;
      }
      const cleanBaseName = baseName.replace(/(^-|-$)/g, "");
      const fileName = `${cleanBaseName}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], filePath.split("/").pop() || "image", {
        type: mimeType,
      });

      const { error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;
      return filePath;
    } catch (err) {
      console.error("Failed to upload base64 image to Supabase on save:", err);
      return imageSrc;
    }
  };

  const loading = isEditing
    ? categoriesLoading || blogLoading
    : categoriesLoading;

  const editorRef = useRef<HTMLDivElement>(null);

  const handleCoverImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCoverImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (isEditing && fetchedBlog) {
      setTitle(fetchedBlog.title);
      setContent(convertContentToHtml(fetchedBlog.content));
      setCoverImage(fetchedBlog.coverImage || "");
      const categoryVal = Array.isArray(fetchedBlog.category)
        ? fetchedBlog.category.join(", ")
        : fetchedBlog.category || "";
      setCategory(categoryVal);
      setSlug(fetchedBlog.slug);
      setExcerpt(fetchedBlog.excerpt);
      setTagsString(fetchedBlog.tags?.join(", ") || "");
      setStatus(fetchedBlog.status);
    }
  }, [fetchedBlog, isEditing]);

  useEffect(() => {
    if (editorRef.current && !isPreviewMode && !isHtmlMode && !loading) {
      if (editorRef.current.innerHTML !== content) {
        if (content && content !== "Start writing..") {
          editorRef.current.innerHTML = content;
        } else if (!content) {
          editorRef.current.innerHTML =
            '<p class="text-muted-foreground/50">Start writing...</p>';
        }
      }
    }
  }, [content, isPreviewMode, isHtmlMode, loading]);

  const handleBackWithSave = () => {
    const hasNoModifications =
      !isEditing &&
      !title.trim() &&
      (!content || content === "Start writing..");

    if (hasNoModifications) {
      navigate("/blogs");
    } else {
      setShowExitDialog(true);
    }
  };

  const saveAndExit = async () => {
    setIsSavingDraft(true);
    const finalCoverImage = await handleUploadImage(coverImage);
    setCoverImage(finalCoverImage);

    const categoriesArray = category
      ? category
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const tagsArray = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const blogData = {
      title: title.trim() || "Untitled Post",
      slug:
        slug ||
        (title.trim() || "untitled-post")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
      excerpt,
      content: convertHtmlToBlocks(content),
      coverImage: finalCoverImage,
      category: categoriesArray,
      status: "draft" as const,
      tags: tagsArray,
      authorId: user?.id,
      author_name: user?.user_metadata.name || "Admin",
      readingTime: "5 min",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEdit: user?.user_metadata.name || "Admin",
    };

    try {
      if (isEditing && id) {
        await db.updateBlog(id, blogData);
        await queryClient.invalidateQueries({ queryKey: ["blogs"] });
        toast.success("Draft updated successfully");
      } else {
        await db.createBlog(blogData);
        await queryClient.invalidateQueries({ queryKey: ["blogs"] });
        toast.success("Draft saved successfully");
      }
    } catch (err) {
      console.error("Error saving draft on exit:", err);
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
      setShowExitDialog(false);
      navigate("/blogs");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalCoverImage = await handleUploadImage(coverImage);
      setCoverImage(finalCoverImage);

      const categoriesArray = category
        ? category
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : [];

      const tagsArray = tagsString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const blogData = {
        title: title || "Untitled Post",
        slug:
          slug ||
          (title || "untitled-post").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt,
        content: convertHtmlToBlocks(content),
        coverImage: finalCoverImage,
        category: categoriesArray,
        status: status,
        tags: tagsArray,
        authorId: user?.id,
        author_name: user?.user_metadata.name || "Admin",
        readingTime: "5 min",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEdit: user?.user_metadata.name || "Admin",
      };

      if (isEditing && id) {
        updateBlogMutation.mutate(
          { id, blog: blogData },
          {
            onSuccess: () => {
              setIsSaving(false);
              setIsPublishDialogOpen(false);
              toast.success("Blog saved successfully!");
              navigate("/blogs");
            },
            onError: () => {
              setIsSaving(false);
              toast.error("Failed to update blog.");
            },
          },
        );
      } else {
        createBlogMutation.mutate(blogData, {
          onSuccess: () => {
            setIsSaving(false);
            setIsPublishDialogOpen(false);
            toast.success("Blog saved successfully!");
            navigate("/blogs");
          },
          onError: () => {
            setIsSaving(false);
            toast.error("Failed to create blog.");
          },
        });
      }
    } catch (err) {
      setIsSaving(false);
      toast.error("An error occurred while saving.");
    }
  };

  const executeCommand = (command: string, value: string = "") => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML ===
        '<p class="text-muted-foreground/50">Start writing...</p>'
    ) {
      // editorRef.current.innerHTML = "<p><br></p>";
    }
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const insertHTML = (html: string) => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML ===
        '<p class="text-muted-foreground/50">Start writing...</p>'
    ) {
      editorRef.current.innerHTML = "";
    }

    editorRef.current?.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
      }
    }
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
      const isSupabaseConfigured =
        supabaseUrl &&
        !supabaseUrl.includes("YOUR_SUPABASE_PROJECT_URL") &&
        (import.meta.env.VITE_SUPABASE_ANON_KEY || "");

      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `inline/${fileName}`;

          const { error } = await supabase.storage
            .from("blog-images")
            .upload(filePath, file, { cacheControl: "3600", upsert: false });

          if (error) throw error;

          const cleanUrl = supabaseUrl.replace(/\/$/, "");
          const publicUrl = `${cleanUrl}/storage/v1/object/public/blog-images/${filePath}`;
          insertHTML(
            `<img src="${publicUrl}" alt="Uploaded image" class="max-w-full h-auto rounded-lg my-4" />`,
          );
          return;
        } catch (err) {
          console.warn(
            "Supabase inline image upload failed, falling back to base64:",
            err,
          );
        }
      }

      // Fallback: embed as base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        insertHTML(
          `<img src="${url}" alt="Uploaded image" class="max-w-full h-auto rounded-lg my-4" />`,
        );
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
  };

  const restoreSelection = (range: Range | null) => {
    if (range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const handleLinkClick = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : "";
    setLinkText(selectedText);
    setLinkUrl("");
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = () => {
    restoreSelection(savedRange);
    if (!linkUrl.trim()) {
      setIsLinkModalOpen(false);
      return;
    }

    const cleanUrl = linkUrl.trim();
    const textToInsert = linkText.trim() || cleanUrl;

    if (linkText.trim()) {
      executeCommand("createLink", cleanUrl);
    } else {
      insertHTML(
        `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80 transition-colors">${textToInsert}</a>`,
      );
    }

    setIsLinkModalOpen(false);
  };

  const handleVideoClick = () => {
    saveSelection();
    setVideoUrl("");
    setVideoType("youtube");
    setIsVideoModalOpen(true);
  };

  const handleInsertVideo = () => {
    restoreSelection(savedRange);
    if (!videoUrl.trim()) {
      setIsVideoModalOpen(false);
      return;
    }

    let embedHtml = "";
    if (videoType === "youtube") {
      const url = videoUrl.trim();
      const ytRegex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(ytRegex);
      const videoId = match ? match[1] : null;

      if (videoId) {
        embedHtml = `<iframe src="https://www.youtube.com/embed/${videoId}" class="w-full aspect-video rounded-lg my-4" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        toast.error("Invalid YouTube URL.");
        return;
      }
    } else {
      embedHtml = `<video src="${videoUrl.trim()}" controls class="w-full rounded-lg my-4"></video>`;
    }

    insertHTML(embedHtml);
    setIsVideoModalOpen(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const isSupabaseConfigured =
      supabaseUrl &&
      !supabaseUrl.includes("YOUR_SUPABASE_PROJECT_URL") &&
      (import.meta.env.VITE_SUPABASE_ANON_KEY || "");

    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `inline-videos/${fileName}`;

        const { error } = await supabase.storage
          .from("blog-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const cleanUrl = supabaseUrl.replace(/\/$/, "");
        const publicUrl = `${cleanUrl}/storage/v1/object/public/blog-images/${filePath}`;
        setVideoUrl(publicUrl);
        toast.success("Video uploaded successfully!");
      } catch (err) {
        console.error("Supabase video upload failed:", err);
        toast.error("Failed to upload video to storage.");
      } finally {
        setIsVideoUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setVideoUrl(url);
        toast.success("Video prepared successfully!");
        setIsVideoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFocus = () => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML ===
        '<p class="text-muted-foreground/50">Start writing...</p>'
    ) {
      editorRef.current.innerHTML = "<p><br></p>";
      const range = document.createRange();
      const sel = window.getSelection();
      if (editorRef.current.firstChild) {
        range.selectNodeContents(editorRef.current.firstChild);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  const handleBlur = () => {
    if (
      editorRef.current &&
      (editorRef.current.innerHTML.trim() === "" ||
        editorRef.current.innerHTML === "<p><br></p>")
    ) {
      editorRef.current.innerHTML =
        '<p class="text-muted-foreground/50">Start writing...</p>';
    }
  };

  return (
    <div className="flex flex-col lg:h-screen min-h-screen">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Editor Canvas */}
        <div className="flex-1 bg-[#8080800d] overflow-y-auto relative">
          {/* Editor Topbar */}
          <div className="sticky top-0 z-10 flex py-2 md:py-0 md:h-14 items-center  justify-between border-b border-border/50 bg-background/80 px-4 md:px-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleBackWithSave}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Draft</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="font-medium truncate max-w-[200px]">
                  {title || "Untitled"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant={isPreviewMode ? "secondary" : "outline"}
                size="sm"
                className="bg-background h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                title={isPreviewMode ? "Edit" : "Preview"}
              >
                {isPreviewMode ? (
                  <>
                    <EyeOff className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Preview</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsPublishDialogOpen(true)}
                size="sm"
                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 gap-2"
                title="Save / Publish"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isSaving ? "Saving..." : "Save / Publish"}
                </span>
              </Button>
            </div>
          </div>

          {isPreviewMode ? (
            <BlogDetailPreview
              blog={{ title, content, coverImage, category }}
              onBackToEditor={() => setIsPreviewMode(false)}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16 py-8 md:py-12">
              {/* Cover Image */}
              <div
                onClick={handleCoverImageClick}
                className="aspect-[16/8] w-full rounded-xl border-2 border-dashed border-border/500 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative mb-8"
              >
                {coverImage ? (
                  <>
                    <img
                      src={getBlogImageUrl(coverImage)}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        Change Cover
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium">Add Cover Image</span>
                    <span className="text-xs mt-1 opacity-70">
                      Recommended size: 1600x840px
                    </span>
                  </>
                )}
              </div>

              {/* Title Input */}
              <textarea
                placeholder="Post title..."
                className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 text-foreground mb-8 placeholder:font-bold resize-none overflow-hidden min-h-[60px]"
                rows={1}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                ref={(el) => {
                  if (el) {
                    // Set height on initial render/value change
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
              />

              {/* Sticky Toolbar Mock */}
              <div className="sticky top-14 sm:top-20 z-20 mb-8 flex flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-background/95 p-1 shadow-sm backdrop-blur">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground"
                    >
                      Normal text <ChevronDown className="ml-2 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="font-sans"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeCommand("formatBlock", "p")}
                    >
                      Normal text
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-2xl font-bold"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeCommand("formatBlock", "h1")}
                    >
                      Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xl font-bold"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeCommand("formatBlock", "h2")}
                    >
                      Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-lg font-bold"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeCommand("formatBlock", "h3")}
                    >
                      Heading 3
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-4 bg-border/50 mx-1"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("bold")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("italic")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("underline")}
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("formatBlock", "pre")}
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleLinkClick}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>

                <div className="w-px h-4 bg-border/50 mx-1"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertUnorderedList")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertOrderedList")}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    insertHTML(
                      '<input type="checkbox" class="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /> ',
                    )
                  }
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("formatBlock", "blockquote")}
                >
                  <Quote className="h-4 w-4" />
                </Button>

                <div className="w-px h-4 bg-border/50 mx-1"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleImageClick}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleVideoClick}
                  title="Insert Video"
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    insertHTML(
                      '<table class="min-w-full divide-y divide-border border rounded-md my-4"><thead><tr class="bg-muted/50"><th class="px-4 py-2 text-left text-xs font-semibold text-muted-foreground border">Header 1</th><th class="px-4 py-2 text-left text-xs font-semibold text-muted-foreground border">Header 2</th></tr></thead><tbody class="divide-y divide-border"><tr><td class="px-4 py-2 text-sm border">Data 1</td><td class="px-4 py-2 text-sm border">Data 2</td></tr></tbody></table>',
                    )
                  }
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertHorizontalRule")}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant={isHtmlMode ? "secondary" : "ghost"}
                  className="text-muted-foreground px-2"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!isHtmlMode) {
                      setContent(formatHtmlString(content));
                    }
                    setIsHtmlMode(!isHtmlMode);
                  }}
                >
                  Code
                </Button>

                <div className="w-px h-4 bg-border/50 mx-1 ml-auto"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("undo")}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("redo")}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              {/* Rich Text Area */}
              {!isHtmlMode ? (
                <div className="relative">
                  <div
                    ref={editorRef}
                    className="prose prose-lg dark:prose-invert bg-white p-3 rounded-lg max-w-none min-h-[400px] outline-none relative"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  {activeMedia && mediaRect && (
                    <div
                      className="absolute pointer-events-none border-2 border-primary image-control-overlay rounded-md"
                      style={{
                        top: mediaRect.top,
                        left: mediaRect.left,
                        width: mediaRect.width,
                        height: mediaRect.height,
                        zIndex: 40,
                      }}
                    >
                      {/* Toolbar */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background border border-border shadow-md rounded-md p-1 flex items-center gap-1 pointer-events-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Move Up"
                          onClick={() => moveMedia("up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Move Down"
                          onClick={() => moveMedia("down")}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border/50 mx-1"></div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Align Left"
                          onClick={() => {
                            activeMedia.style.display = "inline";
                            activeMedia.style.float = "left";
                            activeMedia.style.margin = "0 1rem 1rem 0";
                            activeMedia.style.width = "40%";
                            setTimeout(updateActiveMediaRect, 0);
                            if (editorRef.current)
                              setContent(editorRef.current.innerHTML);
                          }}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Align Center"
                          onClick={() => {
                            activeMedia.style.display = "block";
                            activeMedia.style.float = "none";
                            activeMedia.style.margin = "1rem auto";
                            activeMedia.style.width = "75%";
                            setTimeout(updateActiveMediaRect, 0);
                            if (editorRef.current)
                              setContent(editorRef.current.innerHTML);
                          }}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Align Right"
                          onClick={() => {
                            activeMedia.style.display = "inline";
                            activeMedia.style.float = "right";
                            activeMedia.style.margin = "0 0 1rem 1rem";
                            activeMedia.style.width = "40%";
                            setTimeout(updateActiveMediaRect, 0);
                            if (editorRef.current)
                              setContent(editorRef.current.innerHTML);
                          }}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Full Width"
                          onClick={() => {
                            activeMedia.style.display = "block";
                            activeMedia.style.float = "none";
                            activeMedia.style.margin = "1rem 0";
                            activeMedia.style.width = "100%";
                            setTimeout(updateActiveMediaRect, 0);
                            if (editorRef.current)
                              setContent(editorRef.current.innerHTML);
                          }}
                        >
                          <AlignJustify className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border/50 mx-1"></div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Delete Block"
                          onClick={() => {
                            activeMedia.remove();
                            setActiveMedia(null);
                            if (editorRef.current)
                              setContent(editorRef.current.innerHTML);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Drag Resize Handles */}
                      {/* Corners */}
                      <div
                        className="absolute top-0 left-0 w-3 h-3 bg-primary border border-background rounded-full cursor-nw-resize -mt-1.5 -ml-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                      />
                      <div
                        className="absolute top-0 right-0 w-3 h-3 bg-primary border border-background rounded-full cursor-ne-resize -mt-1.5 -mr-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                      />
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-primary border border-background rounded-full cursor-se-resize -mb-1.5 -mr-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                      />
                      <div
                        className="absolute bottom-0 left-0 w-3 h-3 bg-primary border border-background rounded-full cursor-sw-resize -mb-1.5 -ml-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                      />
                      {/* Sides */}
                      <div
                        className="absolute top-0 left-1/2 w-3 h-3 bg-primary border border-background rounded-full cursor-n-resize -mt-1.5 -ml-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "n")}
                      />
                      <div
                        className="absolute bottom-0 left-1/2 w-3 h-3 bg-primary border border-background rounded-full cursor-s-resize -mb-1.5 -ml-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "s")}
                      />
                      <div
                        className="absolute top-1/2 right-0 w-3 h-3 bg-primary border border-background rounded-full cursor-e-resize -mt-1.5 -mr-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "e")}
                      />
                      <div
                        className="absolute top-1/2 left-0 w-3 h-3 bg-primary border border-background rounded-full cursor-w-resize -mt-1.5 -ml-1.5 pointer-events-auto"
                        onMouseDown={(e) => handleResizeMouseDown(e, "w")}
                      />
                    </div>
                  )}
                  {activeTable && tableRect && (
                    <div
                      className="absolute pointer-events-none border-2 border-dashed border-primary/50 table-control-overlay rounded-md"
                      style={{
                        top: tableRect.top,
                        left: tableRect.left,
                        width: tableRect.width,
                        height: tableRect.height,
                        zIndex: 40,
                      }}
                    >
                      {/* Floating Toolbar above the Table */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background border border-border shadow-md rounded-md p-1 flex items-center gap-1 pointer-events-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Move Up"
                          onClick={() => moveTable("up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Move Down"
                          onClick={() => moveTable("down")}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border/50 mx-1"></div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                          title="Add Row"
                          onClick={() => addRow("below")}
                        >
                          Row +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                          title="Add Column"
                          onClick={addColumn}
                        >
                          Col +
                        </Button>
                        <div className="w-px h-4 bg-border/50 mx-1"></div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                          title="Delete Row"
                          onClick={deleteRow}
                        >
                          Row -
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                          title="Delete Column"
                          onClick={deleteColumn}
                        >
                          Col -
                        </Button>
                        <div className="w-px h-4 bg-border/50 mx-1"></div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Delete Table"
                          onClick={() => {
                            activeTable.remove();
                            setActiveTable(null);
                            if (editorRef.current)
                              setContent(editorRef.current.innerHTML);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-lg dark:prose-invert bg-white p-3 rounded-lg max-w-none  outline-none relative">
                  <textarea
                    className="w-full min-h-[400px] outline-none resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="w-full lg:w-80 h-auto lg:h-full border-t lg:border-t-0 lg:border-l border-border/50 bg-background/30 p-6 overflow-y-visible lg:overflow-y-auto shrink-0">
          <h3 className="font-medium mb-6 flex items-center gap-2">
            <LayoutPanelLeft className="h-4 w-4" /> Post Settings
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                placeholder="my-awesome-post"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <MultiDropdown
                value={category}
                onChange={setCategory}
                options={
                  categories.length > 0 ? categories.map((c) => c.name) : []
                }
                placeholder="Select categories..."
                onAddOption={handleAddCustomCategory}
                addOptionLabel="Add category"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium mr-5">Status</label>
              <div className="w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full">
                    <Button variant="outline" className="w-full !text-start">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuItem onClick={() => setStatus("draft")}>
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatus("published")}>
                      Published
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Excerpt</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A short summary of your post..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <MultiDropdown
                value={tagsString}
                onChange={setTagsString}
                options={availableTags}
                placeholder="Select or search tags..."
                onAddOption={handleAddCustomTag}
                addOptionLabel="Add tag"
              />
            </div>

            <div className="pt-4 border-t border-border/50 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">SEO</h4>
              <div className="space-y-2">
                <label className="text-xs font-medium">Meta Title</label>
                <Input placeholder="SEO Title" className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Meta Description</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="SEO description..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExitDialog && (
        <div className="fixed inset-0 m-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border p-6 rounded-xl shadow-lg max-w-md w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground">
              Save as Draft?
            </h3>
            <p className="text-sm text-muted-foreground">
              You have unsaved changes. Do you want to save this post as a draft
              before leaving?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowExitDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setShowExitDialog(false);
                  navigate("/blogs");
                }}
              >
                Discard
              </Button>
              <Button
                onClick={saveAndExit}
                disabled={isSavingDraft}
                className="gap-2"
              >
                {isSavingDraft && <Loader2 className="h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save & Publish Confirmation Modal */}
      <Modal
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        title="Confirm Save & Publish Options"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-foreground">
          <div className="space-y-1">
            <label className="text-sm font-medium">Post Title</label>
            <Input
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <Input
              placeholder="post-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <Input
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Excerpt</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              placeholder="Short summary..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Link Insertion Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Insert Link"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink} disabled={!linkUrl.trim()}>
              Insert
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Link Text</label>
            <Input
              placeholder="e.g. Visit our website"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">URL</label>
            <Input
              type="url"
              placeholder="e.g. https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && linkUrl.trim()) {
                  handleInsertLink();
                }
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Video Insertion Modal */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Insert Video"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsVideoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsertVideo}
              disabled={!videoUrl.trim() || isVideoUploading}
            >
              Insert Video
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              type="button"
              variant={videoType === "youtube" ? "secondary" : "ghost"}
              className="flex-1 text-xs"
              onClick={() => {
                setVideoType("youtube");
                setVideoUrl("");
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-2 h-3.5 w-3.5 text-red-500 inline-block"
              >
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube Link
            </Button>
            <Button
              type="button"
              variant={videoType === "file" ? "secondary" : "ghost"}
              className="flex-1 text-xs"
              onClick={() => {
                setVideoType("file");
                setVideoUrl("");
              }}
            >
              <Video className="mr-2 h-3.5 w-3.5 text-blue-500" />
              Upload / Direct Link
            </Button>
          </div>

          {videoType === "youtube" ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">YouTube URL</label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && videoUrl.trim()) {
                    handleInsertVideo();
                  }
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="text-xs text-muted-foreground mb-2 text-center">
                  or upload local file
                </div>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer bg-background hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isVideoUploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-primary mb-1" />
                          <p className="text-xs text-muted-foreground">
                            Uploading video...
                          </p>
                        </>
                      ) : (
                        <>
                          <Video className="h-6 w-6 text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground font-medium text-center">
                            Click to select MP4/WebM file
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={isVideoUploading}
                      onChange={handleVideoUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prose iframe, .prose video {
          pointer-events: none;
        }
        .prose-lg p,
        .prose-lg :where(p):not(:where([class~="not-prose"],[class~="not-prose"] *)) {
          margin-top: 0px !important;
          margin-bottom: 0px !important;
        }
      `,
        }}
      />
    </div>
  );
}
