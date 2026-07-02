import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBlogImageUrl(path: string | undefined): string {
  if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  if (url && !url.includes("YOUR_SUPABASE_PROJECT_URL")) {
    const cleanUrl = url.replace(/\/$/, "");
    const cleanPath = path.replace(/^\//, "");
    const tokenParam = anonKey ? `?token=${anonKey}` : "";
    return `${cleanUrl}/storage/v1/object/public/blog-images/${cleanPath}${tokenParam}`;
  }
  return path;
}

export function convertContentToHtml(content: any): string {
  if (!content) return "";
  if (typeof content === "string") {
    if (content.trim().startsWith("[") || content.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(content);
        return convertContentToHtml(parsed);
      } catch (e) {}
    }
    return content;
  }
  
  if (content && typeof content === "object") {
    // Editor.js structure
    if (Array.isArray(content.blocks)) {
      return content.blocks
        .map((block: any) => {
          if (block.type === "paragraph" || block.type === "header") {
            const tag = block.type === "header" ? `h${block.data?.level || 2}` : "p";
            return `<${tag}>${block.data?.text || ""}</${tag}>`;
          }
          if (block.type === "list") {
            const listTag = block.data?.style === "ordered" ? "ol" : "ul";
            const items = Array.isArray(block.data?.items)
              ? block.data.items.map((item: any) => `<li>${item}</li>`).join("")
              : "";
            return `<${listTag}>${items}</${listTag}>`;
          }
          return "";
        })
        .join("");
    }
  }

  if (Array.isArray(content)) {
    return content.map((node) => convertNodeToHtml(node)).join("");
  }
  if (typeof content === "object") {
    return convertNodeToHtml(content);
  }
  return String(content);
}

function convertNodeToHtml(node: any): string {
  if (!node) return "";
  
  // Slate / Payload CMS text node
  if (node.text !== undefined) {
    let text = node.text;
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    if (node.code) text = `<code>${text}</code>`;
    return text;
  }

  // Children rendering
  const childrenHtml = Array.isArray(node.children)
    ? node.children.map((child: any) => convertNodeToHtml(child)).join("")
    : "";

  // Tag wrapper mapping
  switch (node.type) {
    case "h1":
      return `<h1>${childrenHtml}</h1>`;
    case "h2":
      return `<h2>${childrenHtml}</h2>`;
    case "h3":
      return `<h3>${childrenHtml}</h3>`;
    case "h4":
      return `<h4>${childrenHtml}</h4>`;
    case "h5":
      return `<h5>${childrenHtml}</h5>`;
    case "h6":
      return `<h6>${childrenHtml}</h6>`;
    case "blockquote":
      return `<blockquote>${childrenHtml}</blockquote>`;
    case "ul":
      return `<ul>${childrenHtml}</ul>`;
    case "ol":
      return `<ol>${childrenHtml}</ol>`;
    case "li":
      return `<li>${childrenHtml}</li>`;
    case "link":
      return `<a href="${node.url || ""}">${childrenHtml}</a>`;
    case "paragraph":
    default:
      return `<p>${childrenHtml}</p>`;
  }
}
