import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BlogDetailPreview } from "@/components/BlogDetailPreview";
import { db } from "@/lib/db";
import type { Blog } from "@/types";

export function BlogPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  const previewData = location.state || {};

  useEffect(() => {
    async function loadBlog() {
      if (!id || id === "new") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await db.getBlog(id);
        setBlog(data);
      } catch (err) {
        console.error("Error fetching preview blog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [id]);

  const defaultBlog: Blog = {
    id: id || "new",
    title: "",
    slug: "",
    excerpt: "",
    content: "Start writing..",
    coverImage: "",
    category: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    author: { name: "Author", avatar: "https://i.pravatar.cc/150?u=author" },
    readingTime: "5 min",
    status: "draft",
  };

  const activeBlog = blog || defaultBlog;

  const mergedBlog = {
    ...activeBlog,
    title:
      previewData.title !== undefined ? previewData.title : activeBlog.title,
    content:
      previewData.content !== undefined
        ? previewData.content
        : activeBlog.content,
    coverImage:
      previewData.coverImage !== undefined
        ? previewData.coverImage
        : activeBlog.coverImage,
    category:
      previewData.category !== undefined
        ? previewData.category
        : activeBlog.category,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center text-muted-foreground flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
          Loading preview...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background">
      {/* Sticky top bar just for admin */}
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#E2E8F0] dark:border-border/50 bg-white/80 dark:bg-card/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full text-foreground hover:text-foreground/80"
          >
            <Link to="/blogs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm font-medium text-[#0A1128] dark:text-foreground">
            Preview Mode
          </span>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-[#FF5A1F] hover:bg-[#E04E1A] text-white"
        >
          <Link to={`/blogs/${mergedBlog.id}`}>Edit Post</Link>
        </Button>
      </div>

      <BlogDetailPreview
        blog={mergedBlog}
        onBackToEditor={() => navigate(`/blogs/${mergedBlog.id}`)}
      />
    </div>
  );
}
