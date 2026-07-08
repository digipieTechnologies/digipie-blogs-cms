import { supabase } from "./supabase";
import type { Blog, Category, Tag } from "@/types";
import { mockBlogs as initialMockBlogs, mockCategories as initialMockCategories } from "@/data/mock";

// In-memory data store with LocalStorage persistence for mock data mode
const getLocalBlogs = (): Blog[] => {
  try {
    const saved = localStorage.getItem("digipie_blogs");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return initialMockBlogs;
};

const saveLocalBlogs = (blogs: Blog[]) => {
  try {
    localStorage.setItem("digipie_blogs", JSON.stringify(blogs));
  } catch (e) {}
};

const getLocalCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem("digipie_categories");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return initialMockCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    totalBlogs: cat.totalBlogs,
    createdAt: cat.createdAt,
  }));
};

const saveLocalCategories = (categories: Category[]) => {
  try {
    localStorage.setItem("digipie_categories", JSON.stringify(categories));
  } catch (e) {}
};

const getLocalTags = (): Tag[] => {
  try {
    const saved = localStorage.getItem("digipie_tags");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  
  const blogs = getLocalBlogs();
  const tagsSet = new Set<string>();
  blogs.forEach(b => b.tags?.forEach(t => tagsSet.add(t)));
  const defaultList = tagsSet.size > 0 ? Array.from(tagsSet) : [];
  
  const initialTags = defaultList.map((name, i) => ({
    id: `tag-${i}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    totalBlogs: blogs.filter(b => b.tags?.includes(name)).length,
    createdAt: new Date().toISOString()
  }));
  
  try {
    localStorage.setItem("digipie_tags", JSON.stringify(initialTags));
  } catch (e) {}
  
  return initialTags;
};

const saveLocalTags = (tags: Tag[]) => {
  try {
    localStorage.setItem("digipie_tags", JSON.stringify(tags));
  } catch (e) {}
};

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

// Database APIs
export const db = {
  // --- BLOGS CRUD ---
  async getBlogs(): Promise<Blog[]> {
    if (!isSupabaseConfigured()) {
      return getLocalBlogs();
    }
    try {
      const { data: blogsData, error } = await supabase
        .from("blogs")
        .select(`
          *,
          author:users!blogs_author_id_fkey (
            name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all categories and tags to resolve names in memory
      const { data: allCats } = await supabase.from("categories").select("id, name");
      const { data: allTags } = await supabase.from("tags").select("id, name");

      return (blogsData || []).map((b: any) => {
        const categories = (b.category_ids || [])
          .map((cid: string) => allCats?.find((c) => c.id === cid)?.name)
          .filter(Boolean);

        const tags = (b.tag_ids || [])
          .map((tid: string) => allTags?.find((t) => t.id === tid)?.name)
          .filter(Boolean);

        return {
          id: b.id,
          title: b.title,
          slug: b.slug,
          excerpt: b.excerpt || "",
          content: b.content || "",
          category: categories.length > 0 ? categories : [],
          status: b.status || "draft",
          coverImage: b.cover_image || b.coverImage || "",
          author: b.author ? { name: b.author.name || b.author_name, avatar: b.author.avatar_url } : { name: b.author_name || "unknown", avatar: "" },
          authorId: b.author_id,
          createdAt: b.created_at || b.createdAt,
          updatedAt: b.updated_at || b.updatedAt,
          publishedAt: b.published_at || b.publishedAt,
          readingTime: b.reading_time ? `${b.reading_time} min` : b.readingTime || "5 min",
          tags: tags.length > 0 ? tags : (b.tags || []),
          lastEdit: b.last_edit,
          metaTitle: b.meta_title || "",
          metaDescription: b.meta_description || "",
        };
      });
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to local storage:", err);
      return getLocalBlogs();
    }
  },

  async getBlog(id: string): Promise<Blog | null> {
    if (!isSupabaseConfigured()) {
      return getLocalBlogs().find((b) => b.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          *,
          author:users!blogs_author_id_fkey (
            name,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Fetch all categories and tags to resolve names
      const { data: allCats } = await supabase.from("categories").select("id, name");
      const { data: allTags } = await supabase.from("tags").select("id, name");

      const categories = (data.category_ids || [])
        .map((cid: string) => allCats?.find((c) => c.id === cid)?.name)
        .filter(Boolean);

      const tags = (data.tag_ids || [])
        .map((tid: string) => allTags?.find((t) => t.id === tid)?.name)
        .filter(Boolean);

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content || "",
        category: categories.length > 0 ? categories : [],
        status: data.status || "draft",
        coverImage: data.cover_image || data.coverImage || "",
        author: data.author ? { name: data.author.name, avatar: data.author.avatar_url } : { name: "Admin", avatar: "https://i.pravatar.cc/150?u=admin" },
        authorId: data.author_id,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        publishedAt: data.published_at || data.publishedAt,
        readingTime: data.reading_time ? `${data.reading_time} min` : data.readingTime || "5 min",
        tags: tags.length > 0 ? tags : (data.tags || []),
        lastEdit: data.last_edit,
        metaTitle: data.meta_title || "",
        metaDescription: data.meta_description || "",
      };
    } catch (err) {
      console.warn(`Supabase fetch for blog ${id} failed, falling back:`, err);
      return getLocalBlogs().find((b) => b.id === id) || null;
    }
  },

  async createBlog(blog: Omit<Blog, "id">): Promise<Blog> {
    if (!isSupabaseConfigured()) {
      const newBlog: Blog = {
        ...blog,
        id: Math.random().toString(36).substring(2, 9),
      };
      const list = getLocalBlogs();
      list.unshift(newBlog);
      saveLocalBlogs(list);
      return newBlog;
    }
    try {
      // Find category IDs (for array column category_ids)
      const categoryNames = Array.isArray(blog.category)
        ? blog.category
        : (typeof blog.category === 'string' ? blog.category.split(",").map(c => c.trim()).filter(Boolean) : [blog.category].filter(Boolean));

      const categoryIds: string[] = [];
      for (const catNameOrSlug of categoryNames) {
        let { data: catData } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", catNameOrSlug)
          .maybeSingle();

        if (!catData) {
          const { data: catDataByName } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", catNameOrSlug)
            .maybeSingle();
          catData = catDataByName;
        }

        if (catData) categoryIds.push(catData.id);
      }

      // Find or create tags (for array column tag_ids)
      const tagsArray = Array.isArray(blog.tags)
        ? blog.tags
        : (typeof (blog.tags as any) === 'string' ? (blog.tags as any).split(",").map((t: string) => t.trim()).filter(Boolean) : []);

      const tagIds: string[] = [];
      for (const tagName of tagsArray) {
        let tagId = null;
        const { data: tagRecord } = await supabase
          .from("tags")
          .select("id")
          .ilike("name", tagName)
          .maybeSingle();

        if (tagRecord) {
          tagId = tagRecord.id;
        } else {
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: tagName, slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-") })
            .select("id")
            .maybeSingle();
          if (newTag) tagId = newTag.id;
        }
        if (tagId) tagIds.push(tagId);
      }

      const dbBlog = {
        title: blog.title,
        slug: blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: blog.excerpt,
        content: blog.content,
        category_ids: categoryIds,
        tag_ids: tagIds,
        status: blog.status,
        author_id: blog.authorId || null,
        cover_image: blog.coverImage,
        reading_time: typeof blog.readingTime === 'string' ? (parseInt(blog.readingTime) || 5) : (blog.readingTime || 5),
        published_at: blog.status === "published" ? new Date().toISOString() : null,
        last_edit: blog.lastEdit || null,
        meta_title: blog.metaTitle || "",
        meta_description: blog.metaDescription || "",
      };

      const { data, error } = await supabase
        .from("blogs")
        .insert(dbBlog)
        .select()
        .single();

      if (error) throw error;

      return {
        ...blog,
        id: data.id,
      };
    } catch (err) {
      console.warn("Supabase create failed, using local fallback:", err);
      const newBlog: Blog = {
        ...blog,
        id: Math.random().toString(36).substring(2, 9),
      };
      const list = getLocalBlogs();
      list.unshift(newBlog);
      saveLocalBlogs(list);
      return newBlog;
    }
  },

  async updateBlog(id: string, blog: Partial<Blog>): Promise<void> {
    if (!isSupabaseConfigured()) {
      const list = getLocalBlogs();
      const idx = list.findIndex((b) => b.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...blog } as Blog;
        saveLocalBlogs(list);
      }
      return;
    }
    try {
      let categoryIds = undefined;
      if (blog.category !== undefined) {
        const categoryNames = Array.isArray(blog.category)
          ? blog.category
          : (typeof blog.category === 'string' ? blog.category.split(",").map(c => c.trim()).filter(Boolean) : [blog.category].filter(Boolean));

        categoryIds = [];
        for (const catNameOrSlug of categoryNames) {
          let { data: catData } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", catNameOrSlug)
            .maybeSingle();

          if (!catData) {
            const { data: catDataByName } = await supabase
              .from("categories")
              .select("id")
              .ilike("name", catNameOrSlug)
              .maybeSingle();
            catData = catDataByName;
          }

          if (catData) categoryIds.push(catData.id);
        }
      }

      let tagIds = undefined;
      if (blog.tags !== undefined) {
        const tagsArray = Array.isArray(blog.tags)
          ? blog.tags
          : (typeof (blog.tags as any) === 'string' ? (blog.tags as any).split(",").map((t: string) => t.trim()).filter(Boolean) : []);

        tagIds = [];
        for (const tagName of tagsArray) {
          let tagId = null;
          const { data: tagRecord } = await supabase
            .from("tags")
            .select("id")
            .ilike("name", tagName)
            .maybeSingle();

          if (tagRecord) {
            tagId = tagRecord.id;
          } else {
            const { data: newTag } = await supabase
              .from("tags")
              .insert({ name: tagName, slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-") })
              .select("id")
              .maybeSingle();
            if (newTag) tagId = newTag.id;
          }
          if (tagId) tagIds.push(tagId);
        }
      }

      const updateData: any = {};
      if (blog.title !== undefined) updateData.title = blog.title;
      if (blog.slug !== undefined) updateData.slug = blog.slug;
      if (blog.excerpt !== undefined) updateData.excerpt = blog.excerpt;
      if (blog.content !== undefined) updateData.content = blog.content;
      if (categoryIds !== undefined) updateData.category_ids = categoryIds;
      if (tagIds !== undefined) updateData.tag_ids = tagIds;
      if (blog.authorId !== undefined) updateData.author_id = blog.authorId;
      if (blog.status !== undefined) {
        updateData.status = blog.status;
        if (blog.status === "published") {
          updateData.published_at = new Date().toISOString();
        } else if (blog.status === "draft") {
          updateData.published_at = null;
        }
      }
      if (blog.coverImage !== undefined) updateData.cover_image = blog.coverImage;
      if (blog.readingTime !== undefined) updateData.reading_time = typeof blog.readingTime === 'string' ? (parseInt(blog.readingTime) || 5) : blog.readingTime;
      if (blog.lastEdit !== undefined) updateData.last_edit = blog.lastEdit;
      if (blog.metaTitle !== undefined) updateData.meta_title = blog.metaTitle;
      if (blog.metaDescription !== undefined) updateData.meta_description = blog.metaDescription;

      const { error } = await supabase
        .from("blogs")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase update failed, using local fallback:", err);
      const list = getLocalBlogs();
      const idx = list.findIndex((b) => b.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...blog } as Blog;
        saveLocalBlogs(list);
      }
    }
  },

  async deleteBlog(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const list = getLocalBlogs();
      const filtered = list.filter((b) => b.id !== id);
      saveLocalBlogs(filtered);
      return;
    }
    try {
      const { data: blogData } = await supabase
        .from("blogs")
        .select("cover_image")
        .eq("id", id)
        .maybeSingle();

      if (blogData?.cover_image) {
        const cleanCoverImage = blogData.cover_image.split("?")[0];
        const parts = cleanCoverImage.split("blog-images/");
        const filePath = decodeURIComponent(parts.length > 1 ? parts[1] : cleanCoverImage);
        
        await supabase.storage.from("blog-images").remove([filePath]);
      }

      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase delete failed, using local fallback:", err);
      const list = getLocalBlogs();
      const filtered = list.filter((b) => b.id !== id);
      saveLocalBlogs(filtered);
    }
  },

  // --- CATEGORIES CRUD ---
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      return getLocalCategories();
    }
    try {
      const { data: catData, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      const { data: blogsData } = await supabase
        .from("blogs")
        .select("category_ids");

      return (catData || []).map((cat: any) => {
        const totalBlogs = (blogsData || []).filter((b: any) =>
          (b.category_ids || []).includes(cat.id)
        ).length;

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          totalBlogs,
          createdAt: cat.created_at || cat.createdAt,
        };
      });
    } catch (err) {
      console.warn("Supabase categories fetch failed, falling back:", err);
      return getLocalCategories();
    }
  },

  async createCategory(category: Omit<Category, "id" | "totalBlogs" | "createdAt">): Promise<Category> {
    if (!isSupabaseConfigured()) {
      const newCat: Category = {
        ...category,
        id: Math.random().toString(36).substring(2, 9),
        totalBlogs: 0,
        createdAt: new Date().toISOString(),
      };
      const list = getLocalCategories();
      list.push(newCat);
      saveLocalCategories(list);
      return newCat;
    }
    try {
      const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: category.name, slug })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        totalBlogs: 0,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.warn("Supabase category creation failed, using local fallback:", err);
      const newCat: Category = {
        ...category,
        id: Math.random().toString(36).substring(2, 9),
        totalBlogs: 0,
        createdAt: new Date().toISOString(),
      };
      const list = getLocalCategories();
      list.push(newCat);
      saveLocalCategories(list);
      return newCat;
    }
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    if (!isSupabaseConfigured()) {
      const list = getLocalCategories();
      const idx = list.findIndex((c) => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...category } as Category;
        saveLocalCategories(list);
      }
      return;
    }
    try {
      const updateData: any = {};
      if (category.name !== undefined) updateData.name = category.name;
      if (category.slug !== undefined) updateData.slug = category.slug;

      const { error } = await supabase
        .from("categories")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase category update failed, using local fallback:", err);
      const list = getLocalCategories();
      const idx = list.findIndex((c) => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...category } as Category;
        saveLocalCategories(list);
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const list = getLocalCategories();
      const filtered = list.filter((c) => c.id !== id);
      saveLocalCategories(filtered);
      return;
    }
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase category deletion failed, using local fallback:", err);
      const list = getLocalCategories();
      const filtered = list.filter((c) => c.id !== id);
      saveLocalCategories(filtered);
    }
  },

  async getTags(): Promise<string[]> {
    if (!isSupabaseConfigured()) {
      const blogs = getLocalBlogs();
      const tagsSet = new Set<string>();
      blogs.forEach(b => b.tags?.forEach(t => tagsSet.add(t)));
      if (tagsSet.size === 0) {
        return ["React", "TypeScript", "JavaScript", "CSS", "HTML", "NextJS", "UI/UX", "Tailwind"];
      }
      return Array.from(tagsSet);
    }
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("name")
        .order("name");
      if (error) throw error;
      return (data || []).map((t: any) => t.name);
    } catch (err) {
      console.warn("Supabase tags fetch failed, using local fallback:", err);
      const blogs = getLocalBlogs();
      const tagsSet = new Set<string>();
      blogs.forEach(b => b.tags?.forEach(t => tagsSet.add(t)));
      return Array.from(tagsSet);
    }
  },

  async createTag(name: string): Promise<string> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!isSupabaseConfigured()) {
      return name;
    }
    try {
      // Check if tag already exists (case-insensitive)
      const { data: existingTag } = await supabase
        .from("tags")
        .select("name")
        .ilike("name", name)
        .maybeSingle();
        
      if (existingTag) {
        return existingTag.name;
      }
      
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, slug })
        .select("name")
        .single();
        
      if (error) throw error;
      return data.name;
    } catch (err) {
      console.warn("Supabase tag insertion failed:", err);
      return name;
    }
  },

  async getTagsDetailed(): Promise<Tag[]> {
    if (!isSupabaseConfigured()) {
      return getLocalTags();
    }
    try {
      const { data: tagData, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;

      const { data: blogsData } = await supabase
        .from("blogs")
        .select("tag_ids");

      return (tagData || []).map((t: any) => {
        const totalBlogs = (blogsData || []).filter((b: any) =>
          (b.tag_ids || []).includes(t.id)
        ).length;

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          totalBlogs,
          createdAt: t.created_at || t.createdAt,
        };
      });
    } catch (err) {
      console.warn("Supabase detailed tags fetch failed, using local fallback:", err);
      return getLocalTags();
    }
  },

  async createTagDetailed(tag: Omit<Tag, "id" | "totalBlogs" | "createdAt">): Promise<Tag> {
    if (!isSupabaseConfigured()) {
      const newTag: Tag = {
        ...tag,
        id: Math.random().toString(36).substring(2, 9),
        totalBlogs: 0,
        createdAt: new Date().toISOString(),
      };
      const list = getLocalTags();
      list.push(newTag);
      saveLocalTags(list);
      return newTag;
    }
    try {
      const slug = tag.slug || tag.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: tag.name, slug })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        totalBlogs: 0,
        createdAt: data.created_at || data.createdAt,
      };
    } catch (err) {
      console.warn("Supabase tag creation detailed failed, using local fallback:", err);
      const newTag: Tag = {
        ...tag,
        id: Math.random().toString(36).substring(2, 9),
        totalBlogs: 0,
        createdAt: new Date().toISOString(),
      };
      const list = getLocalTags();
      list.push(newTag);
      saveLocalTags(list);
      return newTag;
    }
  },

  async updateTag(id: string, tag: Partial<Tag>): Promise<void> {
    if (!isSupabaseConfigured()) {
      const list = getLocalTags();
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...tag } as Tag;
        saveLocalTags(list);
      }
      return;
    }
    try {
      const updateData: any = {};
      if (tag.name !== undefined) updateData.name = tag.name;
      if (tag.slug !== undefined) updateData.slug = tag.slug;
      
      const { error } = await supabase
        .from("tags")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase tag update failed, using local fallback:", err);
      const list = getLocalTags();
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...tag } as Tag;
        saveLocalTags(list);
      }
    }
  },

  async deleteTag(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const list = getLocalTags();
      const filtered = list.filter((t) => t.id !== id);
      saveLocalTags(filtered);
      return;
    }
    try {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase tag delete failed, using local fallback:", err);
      const list = getLocalTags();
      const filtered = list.filter((t) => t.id !== id);
      saveLocalTags(filtered);
    }
  },
};
