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
  Heading1,
  Heading2,
  Heading3,
  Type,
  Bot,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [activeMedia, setActiveMedia] = useState<HTMLElement | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // AI Generation States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProvider, setAiProvider] = useState(
    () => localStorage.getItem("ai_provider") || "pollinations",
  );
  const [aiApiKey, setAiApiKey] = useState(
    () => localStorage.getItem("ai_api_key") || "",
  );

  const handleAiGenerate = () => {
    setIsAiModalOpen(true);
  };

  const submitAiGenerate = async () => {
    if (!title.trim() && !aiPrompt.trim()) {
      toast.error("Please enter a title or a prompt first.");
      return;
    }
    setIsGeneratingAi(true);
    const toastId = toast.loading("AI is crafting your post...");

    const topic = title.trim() || aiPrompt.trim();
    const systemPrompt = `You are a professional blog content writer. Write a comprehensive, detailed blog post about "${topic}". Instruction details: ${aiPrompt || "Write a detailed tutorial/guide style blog post"}. You MUST return the output ONLY as HTML content. Use tags like <h2>, <h3>, <p>, <ul>, <li>, and <blockquote>. Do NOT wrap the code in \`\`\`html markdown block. Start directly with the content.`;

    try {
      let contentHtml = "";

      if (aiProvider === "pollinations") {
        const res = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: `Generate a blog post about "${topic}" in HTML format.`,
              },
            ],
          }),
        });

        if (!res.ok) {
          throw new Error("Pollinations API failed to respond.");
        }

        const text = await res.text();
        contentHtml = text
          .replace(/^```html\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
      } else if (aiProvider === "gemini") {
        if (!aiApiKey) {
          throw new Error(
            "Gemini API key is required. Please set it in Settings.",
          );
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
            }),
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || "Failed to generate content with Gemini.",
          );
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        contentHtml = text
          .replace(/^```html\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
      } else {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (aiApiKey) {
          headers["Authorization"] = `Bearer ${aiApiKey}`;
        }
        const res = await fetch(
          "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              inputs: `<|system|>\n${systemPrompt}</s>\n<|user|>\nWrite the blog post in HTML format.</s>\n<|assistant|>\n`,
              parameters: {
                max_new_tokens: 800,
                temperature: 0.7,
              },
            }),
          },
        );

        if (!res.ok) {
          throw new Error("Hugging Face API inference failed.");
        }

        const data = await res.json();
        const generatedText = Array.isArray(data)
          ? data[0]?.generated_text
          : data?.generated_text;

        if (!generatedText) {
          throw new Error("Empty response from Hugging Face.");
        }

        const assistantMarker = "<|assistant|>";
        const rawHtml = generatedText.includes(assistantMarker)
          ? generatedText.split(assistantMarker).pop() || ""
          : generatedText;

        contentHtml = rawHtml
          .replace(/^```html\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
      }

      if (!contentHtml) {
        throw new Error("No content generated.");
      }

      setContent(contentHtml);
      if (!title.trim()) {
        setTitle(topic);
      }
      toast.success("AI Content generated successfully!", { id: toastId });
      setIsAiModalOpen(false);
      setAiPrompt("");
    } catch (err: any) {
      console.warn("API call failed, falling back to local simulation:", err);
      toast.error(
        `${err.message || "API error"}. Falling back to simulated generation.`,
        { id: toastId },
      );

      setTimeout(() => {
        const generatedHtml = `
<h2>Introduction</h2>
<p>In today's fast-paced tech landscape, exploring <strong>${topic}</strong> has become more critical than ever. Whether you're a seasoned professional or just getting started, understanding the fundamental principles of this topic can significantly boost your productivity and career.</p>

<h2>Key Concepts of ${topic}</h2>
<p>To successfully master this area, there are several core pillars you should focus on:</p>
<ul>
  <li><strong>Foundational architecture:</strong> Ensuring you build on scalable models.</li>
  <li><strong>Efficiency and Speed:</strong> Automating repetitive workflows to save hours of development.</li>
  <li><strong>Continuous Integration:</strong> Testing early and often to deliver high-quality results.</li>
</ul>

<blockquote>
  "The best way to predict the future is to invent it." – Alan Kay
</blockquote>

<h2>Implementation Guide</h2>
<p>Getting started doesn't have to be overwhelming. We recommend breaking down your implementation workflow into three distinct phases: initial planning, setting up the core environment, and iterative polishing.</p>

<h2>Conclusion</h2>
<p>By taking a structured approach to <em>${topic}</em>, teams can innovate faster and build more robust systems. Keep experimenting, stay curious, and continue learning!</p>
        `.trim();

        setContent(generatedHtml);
        if (!title.trim()) {
          setTitle(topic);
        }
        setIsAiModalOpen(false);
        setAiPrompt("");
      }, 1000);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    type: "editor" | "textarea" | null;
    targetElement: HTMLElement | null;
    hasSelection: boolean;
    isCode: boolean;
  } | null>(null);

  const moveSelectedBlock = (direction: "up" | "down") => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node = sel.anchorNode;
    if (!node) return;

    let blockNode: HTMLElement | null =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node.parentElement;

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

    setContent(parent.innerHTML);
  };

  const moveTextareaLine = (
    textarea: HTMLTextAreaElement,
    direction: "up" | "down",
  ) => {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const lines = value.split("\n");
    let charCount = 0;
    let targetLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for \n
      if (charCount <= start && start <= charCount + lineLength) {
        targetLineIdx = i;
        break;
      }
      charCount += lineLength;
    }

    if (targetLineIdx === -1) return;

    if (direction === "up" && targetLineIdx > 0) {
      const temp = lines[targetLineIdx];
      lines[targetLineIdx] = lines[targetLineIdx - 1];
      lines[targetLineIdx - 1] = temp;
    } else if (direction === "down" && targetLineIdx < lines.length - 1) {
      const temp = lines[targetLineIdx];
      lines[targetLineIdx] = lines[targetLineIdx + 1];
      lines[targetLineIdx + 1] = temp;
    } else {
      return;
    }

    const newValue = lines.join("\n");
    textarea.value = newValue;

    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);

    if (textarea.placeholder.includes("Post title")) {
      setTitle(newValue);
    } else if (
      textarea.placeholder.includes("A short summary") ||
      textarea.placeholder.includes("SEO description")
    ) {
      setExcerpt(newValue);
    } else if (textarea.className.includes("w-full min-h-[400px]")) {
      setContent(newValue);
    }
  };

  const formatTextareaSelection = (
    textarea: HTMLTextAreaElement,
    formatType:
      | "bold"
      | "italic"
      | "underline"
      | "code"
      | "h1"
      | "h2"
      | "h3"
      | "p",
  ) => {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = selectedText;
    const isHtml =
      textarea.className.includes("w-full min-h-[400px]") ||
      textarea.placeholder.includes("HTML");

    if (isHtml) {
      switch (formatType) {
        case "bold":
          formattedText = `<strong>${selectedText}</strong>`;
          break;
        case "italic":
          formattedText = `<em>${selectedText}</em>`;
          break;
        case "underline":
          formattedText = `<u>${selectedText}</u>`;
          break;
        case "code":
          formattedText = `<code>${selectedText}</code>`;
          break;
        case "h1":
          formattedText = `<h1>${selectedText}</h1>`;
          break;
        case "h2":
          formattedText = `<h2>${selectedText}</h2>`;
          break;
        case "h3":
          formattedText = `<h3>${selectedText}</h3>`;
          break;
        case "p":
          formattedText = selectedText
            .replace(/^<h[1-3]>/i, "")
            .replace(/<\/h[1-3]>$/i, "");
          formattedText = `<p>${formattedText}</p>`;
          break;
      }
    } else {
      switch (formatType) {
        case "bold":
          formattedText = `**${selectedText}**`;
          break;
        case "italic":
          formattedText = `*${selectedText}*`;
          break;
        case "underline":
          formattedText = `_${selectedText}_`;
          break;
        case "code":
          formattedText = `\`${selectedText}\``;
          break;
        case "h1":
          formattedText = `# ${selectedText}`;
          break;
        case "h2":
          formattedText = `## ${selectedText}`;
          break;
        case "h3":
          formattedText = `### ${selectedText}`;
          break;
        case "p":
          formattedText = selectedText.replace(/^#{1,3}\s+/, "");
          break;
      }
    }

    const newValue =
      value.substring(0, start) + formattedText + value.substring(end);
    textarea.value = newValue;

    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);

    if (textarea.placeholder.includes("Post title")) {
      setTitle(newValue);
    } else if (
      textarea.placeholder.includes("A short summary") ||
      textarea.placeholder.includes("SEO description")
    ) {
      setExcerpt(newValue);
    } else if (textarea.className.includes("w-full min-h-[400px]")) {
      setContent(newValue);
    }
  };

  const isSelectionInCode = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === "PRE" || node.nodeName === "CODE") {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const isTextareaSelectionCode = (textarea: HTMLTextAreaElement) => {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end).trim();

    const isHtml =
      textarea.className.includes("w-full min-h-[400px]") ||
      textarea.placeholder.includes("HTML");

    if (isHtml) {
      return (
        (selectedText.startsWith("<code>") &&
          selectedText.endsWith("</code>")) ||
        (selectedText.startsWith("<pre>") && selectedText.endsWith("</pre>"))
      );
    } else {
      return selectedText.startsWith("`") && selectedText.endsWith("`");
    }
  };

  const removeCodeFormat = (
    targetEl: HTMLElement | null,
    type: "editor" | "textarea",
  ) => {
    if (type === "editor") {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      let node = sel.anchorNode;
      let preNode: HTMLElement | null = null;
      while (node && node !== editorRef.current) {
        if (node.nodeName === "PRE" || node.nodeName === "CODE") {
          preNode = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }
      if (preNode) {
        if (preNode.nodeName === "PRE") {
          executeCommand("formatBlock", "p");
        } else {
          const parent = preNode.parentNode;
          if (parent) {
            while (preNode.firstChild) {
              parent.insertBefore(preNode.firstChild, preNode);
            }
            parent.removeChild(preNode);
            if (editorRef.current) setContent(editorRef.current.innerHTML);
          }
        }
      }
    } else if (type === "textarea" && targetEl) {
      const textarea = targetEl as HTMLTextAreaElement;
      const value = textarea.value;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      let selectedText = value.substring(start, end);

      const isHtml =
        textarea.className.includes("w-full min-h-[400px]") ||
        textarea.placeholder.includes("HTML");

      if (isHtml) {
        selectedText = selectedText
          .replace(/^<code>/, "")
          .replace(/<\/code>$/, "");
        selectedText = selectedText
          .replace(/^<pre>/, "")
          .replace(/<\/pre>$/, "");
      } else {
        selectedText = selectedText.replace(/^`/, "").replace(/`$/, "");
        selectedText = selectedText.replace(/^```/, "").replace(/```$/, "");
      }

      const newValue =
        value.substring(0, start) + selectedText + value.substring(end);
      textarea.value = newValue;

      const event = new Event("input", { bubbles: true });
      textarea.dispatchEvent(event);

      if (textarea.placeholder.includes("Post title")) {
        setTitle(newValue);
      } else if (
        textarea.placeholder.includes("A short summary") ||
        textarea.placeholder.includes("SEO description")
      ) {
        setExcerpt(newValue);
      } else if (textarea.className.includes("w-full min-h-[400px]")) {
        setContent(newValue);
      }
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInsideEditor =
        editorRef.current && editorRef.current.contains(target);
      const isTextarea =
        target.tagName === "TEXTAREA" || target.tagName === "INPUT";

      if (!isInsideEditor && !isTextarea) {
        return;
      }

      e.preventDefault();

      let hasSel = false;
      let isCode = false;
      const type: "editor" | "textarea" = isInsideEditor
        ? "editor"
        : "textarea";

      if (isTextarea) {
        const tx = target as HTMLTextAreaElement | HTMLInputElement;
        hasSel =
          tx.selectionStart !== undefined &&
          tx.selectionStart !== tx.selectionEnd;
        isCode = hasSel
          ? isTextareaSelectionCode(tx as HTMLTextAreaElement)
          : false;
      } else {
        const windowSel = window.getSelection();
        hasSel = windowSel ? windowSel.toString().trim().length > 0 : false;
        isCode = hasSel ? isSelectionInCode() : false;
      }

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        visible: true,
        type,
        targetElement: target,
        hasSelection: hasSel,
        isCode,
      });
    };

    const handleGlobalClick = (e: MouseEvent) => {
      if (e.button === 0) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleGlobalClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const [bubbleMenuRect, setBubbleMenuRect] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [activeLink, setActiveLink] = useState<HTMLAnchorElement | null>(null);
  const [linkRect, setLinkRect] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    code: false,
    ul: false,
    ol: false,
    quote: false,
    h1: false,
    h2: false,
    h3: false,
    p: true,
  });

  const updateActiveFormats = () => {
    if (!editorRef.current) return;

    let block = document.queryCommandValue("formatBlock");
    if (block) {
      block = block.toLowerCase();
    }

    const selection = window.getSelection();
    let isCode = false;
    let isQuote = false;
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeName === "PRE" || node.nodeName === "CODE") isCode = true;
        if (node.nodeName === "BLOCKQUOTE") isQuote = true;
        node = node.parentNode;
      }
    }

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      code: isCode,
      quote: isQuote || block === "blockquote",
      h1: block === "h1",
      h2: block === "h2",
      h3: block === "h3",
      p: block === "p" || block === "div" || !block,
    });
  };

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    const editorEl = editorRef.current;
    if (editorEl) {
      editorEl.addEventListener("keyup", updateActiveFormats);
      editorEl.addEventListener("mouseup", updateActiveFormats);
      editorEl.addEventListener("click", updateActiveFormats);
    }
    return () => {
      document.removeEventListener("selectionchange", updateActiveFormats);
      if (editorEl) {
        editorEl.removeEventListener("keyup", updateActiveFormats);
        editorEl.removeEventListener("mouseup", updateActiveFormats);
        editorEl.removeEventListener("click", updateActiveFormats);
      }
    };
  }, []);

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
          setActiveLink(null);
          return;
        }

        const table = target.closest("table");
        if (table) {
          setActiveTable(table);
          setActiveMedia(null);
          setActiveLink(null);
          return;
        }

        const link = target.closest("a");
        if (link) {
          setActiveLink(link);
          const rect = link.getBoundingClientRect();
          const editorBounds = editorRef.current.getBoundingClientRect();
          setLinkRect({
            top:
              rect.bottom - editorBounds.top + editorRef.current.scrollTop + 5,
            left: rect.left - editorBounds.left + editorRef.current.scrollLeft,
          });
          setActiveMedia(null);
          setActiveTable(null);
          return;
        }
      }

      const clickedElement = e.target as HTMLElement;
      if (
        clickedElement.closest(".image-control-overlay") ||
        clickedElement.closest(".table-control-overlay") ||
        clickedElement.closest(".bubble-menu-overlay") ||
        clickedElement.closest(".link-control-overlay") ||
        clickedElement.tagName === "IMG" ||
        clickedElement.tagName === "VIDEO" ||
        clickedElement.tagName === "IFRAME" ||
        clickedElement.closest("table") ||
        clickedElement.closest("a")
      ) {
        return;
      }

      setActiveMedia(null);
      setActiveTable(null);
      setActiveLink(null);
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current) {
        setBubbleMenuRect(null);
        return;
      }

      // Check if selection is within the editor
      if (
        !editorRef.current.contains(selection.anchorNode) ||
        !editorRef.current.contains(selection.focusNode)
      ) {
        setBubbleMenuRect(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      // Don't show if we are acting on media or table
      if (activeMedia || activeTable) {
        setBubbleMenuRect(null);
        return;
      }

      setBubbleMenuRect({
        top: rect.top - editorRect.top + editorRef.current.scrollTop - 10, // slightly above
        left:
          rect.left -
          editorRect.left +
          editorRef.current.scrollLeft +
          rect.width / 2,
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [activeMedia, activeTable]);

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
      content,
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

  const handleSaveDraftOnly = async (isAutoSave = false) => {
    setIsSavingDraft(true);
    let finalCoverImage = coverImage;
    if (coverImage.startsWith("data:image")) {
      finalCoverImage = await handleUploadImage(coverImage);
      setCoverImage(finalCoverImage);
    }

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
      content,
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
        if (!isAutoSave) toast.success("Draft saved successfully");
      } else {
        const newId = await db.createBlog(blogData);
        await queryClient.invalidateQueries({ queryKey: ["blogs"] });
        if (!isAutoSave) toast.success("Draft saved successfully");
        if (newId) {
          navigate(`/blogs/edit/${newId}`, { replace: true });
        }
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      if (!isAutoSave) toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraftOnly();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        executeCommand("bold");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        executeCommand("italic");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        executeCommand("underline");
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "x"
      ) {
        e.preventDefault();
        if (!isHtmlMode) {
          setContent(formatHtmlString(content));
        }
        setIsHtmlMode(!isHtmlMode);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    title,
    content,
    coverImage,
    category,
    slug,
    excerpt,
    tagsString,
    status,
    isEditing,
    id,
    user,
    isHtmlMode,
  ]);

  // Debounced Auto-Save
  useEffect(() => {
    if (loading || !content || content === "Start writing..") return;

    const timeoutId = setTimeout(() => {
      // Don't auto-save if we haven't typed anything meaningful
      if (title.trim() || content.trim()) {
        handleSaveDraftOnly(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [content, title, coverImage, category, tagsString, excerpt]);

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
        content,
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
    setTimeout(updateActiveFormats, 10);
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
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : "";
    if (
      selectedText &&
      (selectedText.startsWith("http://") ||
        selectedText.startsWith("https://"))
    ) {
      setVideoUrl(selectedText);
      // Auto-detect if it's not youtube
      if (
        !selectedText.includes("youtube.com") &&
        !selectedText.includes("youtu.be")
      ) {
        setVideoType("file");
      } else {
        setVideoType("youtube");
      }
    } else {
      setVideoUrl("");
      setVideoType("youtube");
    }
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
    <div className="flex flex-col lg:h-screen min-h-screen bg-background">
      {/* Editor Topbar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
            variant={isPreviewMode ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-muted-foreground hover:text-foreground"
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
            variant={isSidebarOpen ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Settings"
          >
            <LayoutPanelLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button
            variant={isSidebarOpen ? "secondary" : "ghost"}
            size="sm"
            className="hidden lg:flex h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-muted-foreground hover:text-foreground"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Settings"
          >
            <LayoutPanelLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <Button
            onClick={() => setIsPublishDialogOpen(true)}
            size="sm"
            className="h-8 sm:h-9 px-4 gap-2"
            title="Save / Publish"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isSaving ? "Saving..." : "Publish"}
            </span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">
        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto relative bg-background">
          {isPreviewMode ? (
            <BlogDetailPreview
              blog={{ title, content, coverImage, category }}
              onBackToEditor={() => setIsPreviewMode(false)}
            />
          ) : (
            <div className="max-w-[760px] mx-auto px-6 sm:px-8 md:px-12 py-10 md:py-16">
              {/* Cover Image */}
              {coverImage ? (
                <div className="relative group mb-10">
                  <img
                    src={getBlogImageUrl(coverImage)}
                    alt="Cover"
                    className="w-full h-auto max-h-[400px] object-cover rounded-xl"
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCoverImageClick}
                      className="shadow-sm"
                    >
                      Change
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCoverImage("")}
                      className="shadow-sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCoverImageClick}
                    className="text-muted-foreground hover:text-foreground -ml-3 gap-2"
                  >
                    <ImageIcon className="h-4 w-4" /> Add cover
                  </Button>
                </div>
              )}

              {/* Title Input */}
              <textarea
                placeholder="Article Title"
                className="w-full text-4xl md:text-5xl font-black tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/30 text-foreground mb-10 placeholder:font-black resize-none overflow-hidden min-h-[60px]"
                rows={1}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
              />

              {/* Sticky Toolbar Mock */}
              <div className="sticky top-0 sm:top-2 z-20 mb-8 flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {activeFormats.h1
                        ? "Heading 1"
                        : activeFormats.h2
                          ? "Heading 2"
                          : activeFormats.h3
                            ? "Heading 3"
                            : "Normal text"}
                      <ChevronDown className="ml-2 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[150px]">
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

                <div className="w-px h-4 bg-border mx-1"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.bold ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("bold")}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.italic ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("italic")}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.underline ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("underline")}
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.code ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("formatBlock", "pre")}
                  title="Code Block"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleLinkClick}
                  title="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>

                <div className="w-px h-4 bg-border mx-1"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.ul ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertUnorderedList")}
                  title="Bulleted List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.ol ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertOrderedList")}
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${activeFormats.quote ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("formatBlock", "blockquote")}
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Button>

                <div className="w-px h-4 bg-border mx-1"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleImageClick}
                  title="Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleVideoClick}
                  title="Insert Video"
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    insertHTML(
                      '<table class="min-w-full divide-y divide-border border rounded-md my-4"><thead><tr class="bg-muted/50"><th class="px-4 py-2 text-left text-xs font-semibold text-muted-foreground border">Header 1</th><th class="px-4 py-2 text-left text-xs font-semibold text-muted-foreground border">Header 2</th></tr></thead><tbody class="divide-y divide-border"><tr><td class="px-4 py-2 text-sm border">Data 1</td><td class="px-4 py-2 text-sm border">Data 2</td></tr></tbody></table>',
                    )
                  }
                  title="Table"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertHorizontalRule")}
                  title="Divider"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="default"
                className="w-full mb-2"
                onClick={handleAiGenerate}
              >
                <Bot className="h-4 w-4" />
                Start Ai Generated Content
              </Button>
              {/* Rich Text Area */}
              {!isHtmlMode ? (
                <div className="relative">
                  <div
                    ref={editorRef}
                    className="prose prose-lg dark:prose-invert min-w-full text-slate-800 dark:text-slate-200 min-h-[400px] outline-none relative"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  {bubbleMenuRect && (
                    <div
                      className="absolute bg-background border border-border shadow-md rounded-md p-1 flex items-center gap-1 z-50 transform -translate-x-1/2 -translate-y-full bubble-menu-overlay"
                      style={{
                        top: bubbleMenuRect.top,
                        left: bubbleMenuRect.left,
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${activeFormats.bold ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("bold")}
                        title="Bold"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${activeFormats.italic ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("italic")}
                        title="Italic"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${activeFormats.underline ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("underline")}
                        title="Underline"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-4 bg-border/50 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 font-bold ${activeFormats.h2 ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("formatBlock", "h2")}
                        title="Heading 2"
                      >
                        H2
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 font-bold ${activeFormats.h3 ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("formatBlock", "h3")}
                        title="Heading 3"
                      >
                        H3
                      </Button>
                      <div className="w-px h-4 bg-border/50 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${activeFormats.quote ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          executeCommand("formatBlock", "blockquote")
                        }
                        title="Blockquote"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${activeFormats.code ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("formatBlock", "pre")}
                        title="Code"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleLinkClick}
                        title="Insert Link"
                      >
                        <LinkIcon className="h-4 w-4" />
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
                    </div>
                  )}
                  {activeLink && linkRect && (
                    <div
                      className="absolute bg-background border border-border shadow-md rounded-md p-2 flex items-center gap-2 z-50 link-control-overlay"
                      style={{
                        top: linkRect.top,
                        left: linkRect.left,
                      }}
                    >
                      <a
                        href={activeLink.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline max-w-[200px] truncate"
                      >
                        {activeLink.href}
                      </a>
                      <div className="w-px h-4 bg-border/50 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const text = document.createTextNode(
                            activeLink.textContent || "",
                          );
                          activeLink.parentNode?.replaceChild(text, activeLink);
                          setActiveLink(null);
                          if (editorRef.current)
                            setContent(editorRef.current.innerHTML);
                        }}
                        title="Remove Link"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
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
                <div className="prose prose-lg dark:prose-invert min-w-full min-h-[400px] outline-none relative font-mono text-sm">
                  <textarea
                    className="w-full min-h-[400px] outline-none resize-none bg-muted/20 p-4 rounded-lg"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Sidebar */}
        <div
          className={`
            fixed lg:relative inset-y-0 right-0 z-40 
            w-full sm:w-80 h-full 
            border-l border-border bg-background shadow-2xl lg:shadow-none
            transition-transform duration-300 ease-in-out transform
            ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:hidden hidden"}
            flex flex-col
          `}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex lg:hidden items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Post Settings</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <h3 className="font-semibold mb-6 hidden lg:flex items-center gap-2">
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
                <h4 className="text-sm font-medium text-muted-foreground">
                  SEO
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Meta Title</label>
                  <Input placeholder="SEO Title" className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Meta Description
                  </label>
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

      {/* AI Content Generation Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI Content Generator"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsAiModalOpen(false)}
              disabled={isGeneratingAi}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAiGenerate}
              disabled={isGeneratingAi || (!title.trim() && !aiPrompt.trim())}
              className="gap-2"
            >
              {isGeneratingAi && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-foreground">
          {/* Settings Section */}
          <div className="p-3 bg-muted/40 border rounded-lg space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>API Settings</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={
                  aiProvider === "pollinations" ? "secondary" : "outline"
                }
                className="h-8 text-[10px] justify-center px-1"
                onClick={() => {
                  setAiProvider("pollinations");
                  localStorage.setItem("ai_provider", "pollinations");
                }}
              >
                Free AI (No Key)
              </Button>
              <Button
                type="button"
                variant={aiProvider === "huggingface" ? "secondary" : "outline"}
                className="h-8 text-[10px] justify-center px-1"
                onClick={() => {
                  setAiProvider("huggingface");
                  localStorage.setItem("ai_provider", "huggingface");
                }}
              >
                HuggingFace
              </Button>
              <Button
                type="button"
                variant={aiProvider === "gemini" ? "secondary" : "outline"}
                className="h-8 text-[10px] justify-center px-1"
                onClick={() => {
                  setAiProvider("gemini");
                  localStorage.setItem("ai_provider", "gemini");
                }}
              >
                Gemini API
              </Button>
            </div>

            {aiProvider !== "pollinations" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {aiProvider === "gemini"
                    ? "Gemini API Key (Required)"
                    : "HuggingFace Token (Optional)"}
                </label>
                <Input
                  type="password"
                  placeholder={aiProvider === "gemini" ? "AIzaSy..." : "hf_..."}
                  value={aiApiKey}
                  onChange={(e) => {
                    setAiApiKey(e.target.value);
                    localStorage.setItem("ai_api_key", e.target.value);
                  }}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Blog Title / Topic</label>
            <Input
              placeholder="e.g. Master TypeScript Generics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Add specific instructions or prompt
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              placeholder="e.g. Write a tutorial style post with introduction, key concepts, code snippets, and a conclusion..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </div>
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
        .prose a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        .prose ul, .prose ol {
          margin-top: 0.25em !important;
          margin-bottom: 0.25em !important;
        }
        .prose li {
          margin-top: 0.1em !important;
          margin-bottom: 0.1em !important;
          line-height: 1.5 !important;
        }
        .prose li p {
          margin-top: 0px !important;
          margin-bottom: 0px !important;
        }
        .prose hr {
          margin-top: 1em !important;
          margin-bottom: 1em !important;
          border-color: hsl(var(--border));
        }
      `,
        }}
      />
    </div>
  );
}
