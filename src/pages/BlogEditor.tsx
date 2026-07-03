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
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { BlogDetailPreview } from "@/components/BlogDetailPreview";
import { MultiDropdown } from "@/components/ui/MultiDropdown";
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

const PREDEFINED_TAGS = [
  "React",
  "TypeScript",
  "JavaScript",
  "CSS",
  "HTML",
  "NextJS",
  "UI/UX",
  "Tailwind",
  "Database",
  "Supabase",
  "Design",
  "Product",
  "Engineering",
  "Tutorial",
];

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
  const [content, setContent] = useState("Start writing..");
  const [coverImage, setCoverImage] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [category, setCategory] = useState("Engineering");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsString, setTagsString] = useState("");

  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    // Fetch tags from DB
    db.getTags().then((tags) => {
      const merged = Array.from(new Set([...PREDEFINED_TAGS, ...tags]));
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
      status: "published" as const,
      tags: tagsArray,
      authorId: user?.id,
      author_name: user?.user_metadata.name || "Admin",
      readingTime: "5 min",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing && id) {
      updateBlogMutation.mutate(
        { id, blog: blogData },
        {
          onSuccess: () => {
            toast.success("Blog updated successfully!");
            navigate("/blogs");
          },
          onError: () => {
            toast.error("Failed to update blog.");
          },
        },
      );
    } else {
      createBlogMutation.mutate(blogData, {
        onSuccess: () => {
          toast.success("Blog created successfully!");
          navigate("/blogs");
        },
        onError: () => {
          toast.error("Failed to create blog.");
        },
      });
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

  const handleLinkClick = () => {
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
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
                onClick={handleSave}
                size="sm"
                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                title="Save / Publish"
              >
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save / Publish</span>
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
                  variant={!isHtmlMode ? "secondary" : "ghost"}
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
                <div
                  ref={editorRef}
                  className="prose prose-lg dark:prose-invert bg-white p-3 rounded-lg max-w-none min-h-[400px] outline-none relative"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setContent(e.currentTarget.innerHTML)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
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
                  categories.length > 0
                    ? categories.map((c) => c.name)
                    : ["Engineering", "Product", "Design"]
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
    </div>
  );
}
