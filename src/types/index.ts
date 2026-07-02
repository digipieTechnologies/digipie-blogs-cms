export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any;
  category: string;
  status: 'draft' | 'published' | 'archived';
  coverImage: string;
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  readingTime: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  totalBlogs: number;
  createdAt: string;
}

export interface Media {
  id: string;
  url: string;
  filename: string;
  size: string;
  uploadedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  totalBlogs: number;
  createdAt: string;
}
