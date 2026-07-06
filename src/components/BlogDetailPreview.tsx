import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import type { Blog } from "@/types";
import { getBlogImageUrl, convertContentToHtml } from "@/lib/utils";

interface TocItem {
  id: string;
  label: string;
}

interface BlogDetailPreviewProps {
  blog: {
    title: string;
    content: string;
    coverImage: string;
    category: string;
    createdAt?: string;
    tags?: string[];
  };
  onBackToEditor?: () => void;
}

const injectHeadingIds = (
  html: string,
): { processedHtml: string; toc: TocItem[] } => {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return {
      processedHtml: html,
      toc: [],
    };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3");
  const tocList: TocItem[] = [];

  headings.forEach((heading, index) => {
    const id = heading.id || `heading-${index}`;
    heading.id = id;
    tocList.push({
      id,
      label: heading.textContent || "",
    });
  });

  return {
    processedHtml: doc.body.innerHTML,
    toc: tocList,
  };
};

function TableOfContents({
  toc,
  activeId,
  setActiveId,
}: {
  toc: TocItem[];
  activeId: string;
  setActiveId: (id: string) => void;
}) {
  if (!toc || toc.length === 0) return null;

  return (
    <div className="bg-white min-w-100 rounded-2xl border border-border-brand p-5 shadow-sm">
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-orange mb-4">
        Table of Contents
      </p>
      <nav className="flex flex-col gap-1">
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveId(item.id);
              const el = document.getElementById(item.id);

              if (el) {
                const offset = 120;
                const top =
                  el.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({
                  top,
                  behavior: "smooth",
                });
              }
            }}
            className={`text-[13px] leading-snug px-3 py-2 rounded-lg transition-colors duration-150 ${
              activeId === item.id
                ? "bg-navy-dark text-white font-semibold"
                : "text-slate-600 hover:bg-surface-brand hover:text-navy-dark"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function BlogDetailPreview({
  blog,
  onBackToEditor,
}: BlogDetailPreviewProps) {
  const [activeId, setActiveId] = useState("");

  const { processedHtml, toc } = useMemo(() => {
    const rawHtml = convertContentToHtml(blog.content);
    return injectHeadingIds(rawHtml || "");
  }, [blog.content]);

  useEffect(() => {
    if (!toc || toc.length === 0) return;

    const handleScroll = () => {
      const offset = 140;
      let currentId = "";

      toc.forEach((item) => {
        const element = document.getElementById(item.id);
        if (!element) return;

        const top = element.getBoundingClientRect().top;
        if (top <= offset) {
          currentId = item.id;
        }
      });

      if (currentId && currentId !== activeId) {
        setActiveId(currentId);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [toc, activeId]);

  const [related, setRelated] = useState<Blog[]>([]);

  useEffect(() => {
    async function loadRelated() {
      if (!blog.category) return;
      try {
        const normalizeCategories = (category: string | string[]) =>
          (Array.isArray(category) ? category : [category]).map((c) =>
            c.toLowerCase(),
          );
        const currentCategories = normalizeCategories(blog.category);

        const allBlogs = await db.getBlogs();
        const filtered = allBlogs
          .filter(
            (b) =>
              normalizeCategories(b.category).some((c) =>
                currentCategories.includes(c),
              ) && b.title !== blog.title,
          )
          .slice(0, 3);
        setRelated(filtered);
      } catch (e) {
        console.error("Failed to load related blogs", e);
      }
    }
    loadRelated();
  }, [blog.category, blog.title]);

  const formattedDate = useMemo(() => {
    try {
      return new Date(blog.createdAt || "").toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return new Date().toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }, [blog.createdAt]);

  return (
    <div className="min-h-screen bg-surface-brand">
      <style>{`
        .bg-surface-brand { background-color: #F8FAFC; }
        .bg-navy-dark { background-color: #0A1128; }
        .bg-navy-ghost { background-color: #F0F4F8; }
        .text-navy-dark { color: #0A1128; }
        .text-navy-mid { color: #1C2541; }
        .text-orange { color: #FF5A1F; }
        .bg-orange { background-color: #FF5A1F; }
        .bg-orange-hov:hover { background-color: #E04E1A; }
        .border-border-brand { border-color: #E2E8F0; }
        .max-w-425 { max-width: 1100px; }
        .w-95 { width: 380px; }
        .prose h1 { font-size: 1.875rem; font-weight: 800; color: #0A1128; margin-top: 3rem; margin-bottom: 1rem; }
        .prose h2 { font-size: 1.5rem; font-weight: 700; color: #0A1128; margin-top: 3rem; margin-bottom: 1rem; }
        .prose h3 { font-size: 1.125rem; font-weight: 600; color: #1C2541; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose p { color: #475569; line-height: 1.85; margin-bottom: 1.25rem; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .prose li { color: #475569; line-height: 1.85; margin-bottom: 0.5rem; }
        .prose blockquote { border-left-width: 4px; border-left-color: #FF5A1F; padding-left: 1rem; font-style: italic; color: #0A1128; margin: 1.5rem 0; }
        .prose a { color: #2563eb !important; text-decoration: underline !important; }
      `}</style>

      {/* Hero */}
      <div className="w-full bg-navy-dark relative" style={{ minHeight: 340 }}>
        {blog.coverImage && (
          <img
            src={getBlogImageUrl(blog.coverImage)}
            alt={blog.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent" />
        <div className="relative z-10  mx-auto px-6 md:px-8 lg:px-24 pt-14 pb-12 sm:pt-20 sm:pb-16">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-[13px] font-semibold text-orange">
              {formattedDate}
            </span>
            <span className="w-px h-3.5 bg-white/20" />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/20 text-white/80 bg-white/10">
                {blog.category}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight max-w-3xl">
            {blog.title || "Untitled Post"}
          </h1>
        </div>
      </div>

      {/* Body with optional TOC sidebar */}
      <div className=" flex gap-12 items-start justify-between px-6 md:px-8 lg:px-24 mx-auto py-12 sm:py-16">
        {/* Article */}
        <article className="min-w-0 flex-1">
          {/* Mobile TOC */}
          {toc && toc.length > 0 && (
            <div className="lg:hidden mb-8 bg-white rounded-2xl border border-border-brand p-5">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-orange mb-3">
                Table of Contents
              </p>
              <nav className="flex flex-col gap-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveId(item.id);
                      const el = document.getElementById(item.id);
                      if (el) {
                        const offset = 120;
                        const top =
                          el.getBoundingClientRect().top +
                          window.scrollY -
                          offset;
                        window.scrollTo({
                          top,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="text-[13px] text-slate-600 hover:text-navy-dark px-2 py-1.5 rounded-lg hover:bg-surface-brand transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 leading-[1.85] text-[15px] sm:text-[15.5px]">
            <div
              dangerouslySetInnerHTML={{
                __html: processedHtml || "<p>No content available.</p>",
              }}
            />
          </div>

          {/* Categories + Tags */}
          <div className="mt-12 pt-8 border-t border-border-brand">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-navy-ghost text-navy-mid border border-border-brand">
                #{blog.category}
              </span>
            </div>
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] text-slate-400 self-center mr-1">
                  Tags:
                </span>
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[12px] px-3 py-1 rounded-full bg-orange/10 text-orange border border-orange/20 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Desktop TOC sidebar */}
        {toc && toc.length > 0 && (
          <aside className="hidden lg:block w-95 shrink-0 sticky top-24 self-start">
            <TableOfContents
              toc={toc}
              activeId={activeId}
              setActiveId={setActiveId}
            />
          </aside>
        )}
      </div>

      {/* Related posts */}
      {/* {related.length > 0 && (
        <section className="max-w-425 px-6 md:px-8 lg:px-24 mx-auto pb-16">
          <div className="border-t border-border-brand pt-12">
            <h2 className="text-2xl font-bold text-navy-dark mb-8">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-border-brand overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {p.coverImage && (
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      <img
                        src={getBlogImageUrl(p.coverImage)}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="text-xs font-semibold text-orange mb-2 block uppercase">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-navy-dark text-base mb-2 line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-3 mb-4">
                      {p.excerpt}
                    </p>
                    <Link
                      to={`/blogs/preview/${p.id}`}
                      className="text-xs font-semibold text-navy-mid hover:text-orange transition-colors"
                    >
                      Read Preview →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )} */}

      {/* CTA */}
      {/* <div className="max-w-425 px-6 md:px-8 lg:px-24 mx-auto">
        <section className="mb-16 rounded-3xl overflow-hidden bg-navy-dark relative">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-orange/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 px-8 sm:px-14 py-14 sm:py-16">
            <div className="max-w-lg text-center lg:text-left">
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-orange mb-3">
                Let's Build Together
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
                Ready to transform your{" "}
                <span className="italic font-light text-slate-300">
                  business?
                </span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Tell us about your project and get a detailed proposal within 24
                hours. No commitment required.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                to="#contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-orange text-white text-sm font-semibold hover:bg-orange-hov transition-colors duration-200 shadow-lg shadow-orange/30"
              >
                Start a Project
              </Link>
              <a
                href="tel:+12246031454"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors duration-200"
              >
                Call Us Now
              </a>
            </div>
          </div>
        </section>
      </div> */}
    </div>
  );
}
