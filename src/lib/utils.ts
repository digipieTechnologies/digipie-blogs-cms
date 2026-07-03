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
  if (url && !url.includes("YOUR_SUPABASE_PROJECT_URL")) {
    const cleanUrl = url.replace(/\/$/, "");
    const cleanPath = path.replace(/^\//, "");
    // Public bucket URL — no token param needed; the anon key is a JWT for
    // API authorization headers, not a URL query parameter.
    return `${cleanUrl}/storage/v1/object/public/blog-images/${cleanPath}`;
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
  
  if (Array.isArray(content)) {
    if (
      content.length > 0 &&
      content[0] &&
      content[0].type !== undefined
    ) {
      return content
        .map((block: any) => {
          const idAttr = block.id ? ` id="${block.id}"` : "";
          const text = block.text || "";
          switch (block.type) {
            case "heading":
              return `<h2${idAttr}>${text}</h2>`;
            case "subheading":
              return `<h3${idAttr}>${text}</h3>`;
            case "image":
              return `<img src="${block.src || ""}" alt="${block.alt || ""}" style="${block.style || ""}" class="max-w-full h-auto rounded-lg my-4" />`;
            case "video":
              return `<video src="${block.src || ""}" controls class="w-full rounded-lg my-4"></video>`;
            case "embed":
              return `<iframe src="${block.src || ""}" class="w-full aspect-video rounded-lg my-4" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            case "paragraph":
            default:
              return `<p>${text}</p>`;
          }
        })
        .join("");
    }
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

export function convertHtmlToBlocks(html: string): any[] {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return [{ text: html, type: "paragraph" }];
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: any[] = [];

  const isBlockElement = (node: Element): boolean => {
    const tags = [
      "p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "section", "article",
      "blockquote", "ul", "ol", "li"
    ];
    return tags.includes(node.tagName.toLowerCase());
  };

  const hasBlockChildren = (node: Element): boolean => {
    return Array.from(node.children).some((child) => isBlockElement(child));
  };

  const parseNode = (node: Element) => {
    const tagName = node.tagName.toLowerCase();

    // If it's an image
    if (tagName === "img") {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "";
      const style = node.getAttribute("style") || "";
      blocks.push({ type: "image", src, alt, style });
      return;
    }

    // If it's a video
    if (tagName === "video") {
      const src = node.getAttribute("src") || "";
      blocks.push({ type: "video", src });
      return;
    }

    // If it's an iframe (YouTube embed)
    if (tagName === "iframe") {
      const src = node.getAttribute("src") || "";
      blocks.push({ type: "embed", src });
      return;
    }

    // If it's a heading
    if (tagName === "h1" || tagName === "h2") {
      const text = node.innerHTML.trim();
      if (text) {
        const id =
          node.id ||
          node.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        blocks.push({ id, text, type: "heading" });
      }
      return;
    }

    // If it's a subheading
    if (tagName === "h3" || tagName === "h4") {
      const text = node.innerHTML.trim();
      if (text) {
        const id =
          node.id ||
          node.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        blocks.push({ id, text, type: "subheading" });
      }
      return;
    }

    // If it's a paragraph
    if (tagName === "p") {
      const images = node.querySelectorAll("img, iframe, video");
      if (images.length > 0) {
        Array.from(node.children).forEach((child) => parseNode(child));
        return;
      }
      const text = node.innerHTML.trim();
      if (text) {
        blocks.push({ text, type: "paragraph" });
      }
      return;
    }

    // If it's a list item (li) - treat it as a bulleted paragraph block
    if (tagName === "li") {
      const text = node.innerHTML.trim();
      if (text) {
        blocks.push({ text: `• ${text}`, type: "paragraph" });
      }
      return;
    }

    // If it's a container (like div, section)
    if (hasBlockChildren(node) || node.querySelector("img, iframe, video")) {
      Array.from(node.children).forEach((child) => parseNode(child));
    } else {
      const text = node.innerHTML.trim();
      if (text && tagName !== "body") {
        blocks.push({ text, type: "paragraph" });
      }
    }
  };

  // Start parsing from body children
  Array.from(doc.body.children).forEach((child) => parseNode(child));

  // Fallback if no blocks were parsed but there is raw text
  if (blocks.length === 0 && html.trim()) {
    blocks.push({ text: html.trim(), type: "paragraph" });
  }

  return blocks;
}
