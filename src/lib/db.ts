import { supabase } from "./supabase";
import type { Blog, Category } from "@/types";
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
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          *,
          categories (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt || "",
        content: b.content || "",
        category: b.categories?.name || b.category || "Engineering",
        status: b.status || "draft",
        coverImage: b.cover_image || b.coverImage || "",
        author: b.author || { name: "Admin", avatar: "https://i.pravatar.cc/150?u=admin" },
        createdAt: b.created_at || b.createdAt,
        updatedAt: b.updated_at || b.updatedAt,
        readingTime: b.reading_time ? `${b.reading_time} min` : b.readingTime || "5 min",
        tags: b.tags || [],
      }));
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
          categories (
            name
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Fetch Tags
      const { data: tagData } = await supabase
        .from("blog_tags")
        .select(`
          tags (
            name
          )
        `)
        .eq("blog_id", id);

      const tags = (tagData || [])
        .map((t: any) => t.tags?.name)
        .filter(Boolean);

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content || "",
        category: data.categories?.name || data.category || "Engineering",
        status: data.status || "draft",
        coverImage: data.cover_image || data.coverImage || "",
        author: data.author || { name: "Admin", avatar: "https://i.pravatar.cc/150?u=admin" },
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        readingTime: data.reading_time ? `${data.reading_time} min` : data.readingTime || "5 min",
        tags: tags.length > 0 ? tags : (data.tags || []),
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
      // Find category ID
      let categoryId = null;
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", blog.category)
        .single();
      
      if (catData) {
        categoryId = catData.id;
      }

      const dbBlog = {
        title: blog.title,
        slug: blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: blog.excerpt,
        content: blog.content,
        category_id: categoryId,
        status: blog.status,
        cover_image: blog.coverImage,
        reading_time: typeof blog.readingTime === 'string' ? (parseInt(blog.readingTime) || 5) : (blog.readingTime || 5),
      };

      const { data, error } = await supabase
        .from("blogs")
        .insert(dbBlog)
        .select()
        .single();

      if (error) throw error;

      // Handle tags relations
      if (blog.tags && blog.tags.length > 0) {
        for (const tagName of blog.tags) {
          // Find or create tag
          let tagId = null;
          const { data: tagRecord } = await supabase
            .from("tags")
            .select("id")
            .ilike("name", tagName)
            .single();

          if (tagRecord) {
            tagId = tagRecord.id;
          } else {
            const { data: newTag } = await supabase
              .from("tags")
              .insert({ name: tagName, slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-") })
              .select("id")
              .single();
            if (newTag) tagId = newTag.id;
          }

          if (tagId && data.id) {
            await supabase.from("blog_tags").insert({
              blog_id: data.id,
              tag_id: tagId,
            });
          }
        }
      }

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
      let categoryId = undefined;
      if (blog.category) {
        const { data: catData } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", blog.category)
          .single();
        if (catData) categoryId = catData.id;
      }

      const updateData: any = {};
      if (blog.title !== undefined) updateData.title = blog.title;
      if (blog.slug !== undefined) updateData.slug = blog.slug;
      if (blog.excerpt !== undefined) updateData.excerpt = blog.excerpt;
      if (blog.content !== undefined) updateData.content = blog.content;
      if (categoryId !== undefined) updateData.category_id = categoryId;
      if (blog.status !== undefined) updateData.status = blog.status;
      if (blog.coverImage !== undefined) updateData.cover_image = blog.coverImage;
      if (blog.readingTime !== undefined) updateData.reading_time = typeof blog.readingTime === 'string' ? (parseInt(blog.readingTime) || 5) : blog.readingTime;

      const { error } = await supabase
        .from("blogs")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Update blog_tags relation
      if (blog.tags !== undefined) {
        // Clear existing tags
        await supabase.from("blog_tags").delete().eq("blog_id", id);

        for (const tagName of blog.tags) {
          let tagId = null;
          const { data: tagRecord } = await supabase
            .from("tags")
            .select("id")
            .ilike("name", tagName)
            .single();

          if (tagRecord) {
            tagId = tagRecord.id;
          } else {
            const { data: newTag } = await supabase
              .from("tags")
              .insert({ name: tagName, slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-") })
              .select("id")
              .single();
            if (newTag) tagId = newTag.id;
          }

          if (tagId) {
            await supabase.from("blog_tags").insert({
              blog_id: id,
              tag_id: tagId,
            });
          }
        }
      }
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
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          blogs (
            id
          )
        `)
        .order("name");

      if (error) throw error;

      return (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        totalBlogs: cat.blogs?.length || 0,
        createdAt: cat.created_at || cat.createdAt,
      }));
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
};
