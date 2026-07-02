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
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  CheckSquare,
  Minus,
  Check,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mockBlogs } from "@/data/mock";
import { BlogDetailPreview } from "@/components/BlogDetailPreview";
import { db } from "@/lib/db";
import type { Category } from "@/types";
import { supabase } from "@/lib/supabase";
import { getBlogImageUrl, convertContentToHtml } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const extractHeadings = (html: string): HeadingItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headingElements = doc.querySelectorAll("h2, h3");
  return Array.from(headingElements).map((el, index) => {
    const id = el.id || `heading-${index}`;
    return {
      id,
      text: el.textContent || "",
      level: el.tagName.toLowerCase() === "h2" ? 2 : 3,
    };
  });
};

export function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== "new";
  const existingBlog = isEditing ? mockBlogs.find((b) => b.id === id) : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("Start writing..");
  const [coverImage, setCoverImage] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [category, setCategory] = useState("engineering");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsString, setTagsString] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);

  const handleCoverImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
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

        if (isSupabaseConfigured()) {
          try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { data, error } = await supabase.storage
              .from("blog-images")
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (error) throw error;

            const { data: signData, error: signError } = await supabase.storage
              .from("blog-images")
              .createSignedUrl(filePath, 60 * 60);

            if (signError) throw signError;

            if (signData?.signedUrl) {
              setCoverImage(signData.signedUrl);
              return;
            }
          } catch (err) {
            console.warn(
              "Supabase upload failed, falling back to base64 reader:",
              err,
            );
          }
        }

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
    async function loadEditorData() {
      try {
        setLoading(true);
        const cats = await db.getCategories();
        setCategories(cats);

        if (isEditing && id) {
          const blog = await db.getBlog(id);
          if (blog) {
            setTitle(blog.title);
            setContent(convertContentToHtml(blog.content));
            setCoverImage(blog.coverImage);
            setCategory(blog.category.toLowerCase());
            setSlug(blog.slug);
            setExcerpt(blog.excerpt);
            setTagsString(blog.tags?.join(", ") || "");
            setStatus(blog.status);
          }
        }
      } catch (err) {
        console.error("Failed to load editor data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEditorData();
  }, [id, isEditing]);

  useEffect(() => {
    if (editorRef.current && !isPreviewMode && !isHtmlMode && !loading) {
      if (content && content !== "Start writing..") {
        editorRef.current.innerHTML = content;
      } else {
        editorRef.current.innerHTML =
          '<p class="text-muted-foreground/50">Start writing...</p>';
      }
    }
  }, [isPreviewMode, isHtmlMode, loading]);

  useEffect(() => {
    if (!isHtmlMode && editorRef.current && !loading) {
      editorRef.current.innerHTML = content;
    }
  }, [isHtmlMode, loading]);

  const handleSave = async () => {
    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const blogData = {
      title: title || "Untitled Post",
      slug:
        slug ||
        (title || "untitled-post").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt,
      content,
      coverImage,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      status,
      tags,
      readingTime: "5 min",
      author: { name: "Admin", avatar: "https://i.pravatar.cc/150?u=admin" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditing && id) {
        await db.updateBlog(id, blogData);
        alert("Blog updated successfully!");
      } else {
        const created = await db.createBlog(blogData);
        alert("Blog created successfully!");
        navigate(`/blogs/${created.id}`);
      }
    } catch (err) {
      console.error("Error saving blog:", err);
      alert("Failed to save blog.");
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
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          insertHTML(
            `<img src="${url}" alt="Uploaded image" class="max-w-full h-auto rounded-lg my-4" />`,
          );
        };
        reader.readAsDataURL(file);
      }
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
    <div className="flex flex-col ">
      {/* Main Editor Area */}
      <div className="flex-1 flex   max-h-screen">
        {/* Editor Canvas */}
        <div className="flex-1 bg-[#8080800d] overflow-y-auto">
          {/* Editor Topbar */}
          <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => navigate("/blogs")}
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground mr-2">
                Saved just now
              </span>
              <Button
                variant={isPreviewMode ? "secondary" : "outline"}
                size="sm"
                className="bg-background"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                {isPreviewMode ? "Edit" : "Preview"}
              </Button>
              <Button onClick={handleSave} size="sm">
                Save / Publish
              </Button>
            </div>
          </div>

          {isPreviewMode ? (
            <BlogDetailPreview
              blog={{ title, content, coverImage, category }}
              onBackToEditor={() => setIsPreviewMode(false)}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-16 py-12">
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
              <input
                type="text"
                placeholder="Post title..."
                className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 text-foreground mb-8 placeholder:font-bold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {/* Sticky Toolbar Mock */}
              <div className="sticky top-6 z-20 mb-8 flex items-center gap-1 rounded-lg border border-border/50 bg-background/95 p-1 shadow-sm backdrop-blur">
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
        <div className="w-80 h-full border-l border-border/50 bg-background/30 p-6  overflow-auto lg:block">
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.slug} value={cat.name.toLowerCase()}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="engineering">Engineering</option>
                    <option value="product">Product</option>
                    <option value="design">Design</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
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
              <Input
                placeholder="Add tags separated by comma"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
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
    </div>
  );
}
