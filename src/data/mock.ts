import type { Blog, Category, Media } from '../types';

export const mockCategories: Category[] = [
  { id: '1', name: 'Engineering', slug: 'engineering', totalBlogs: 12, createdAt: '2023-01-15T10:00:00Z' },
  { id: '2', name: 'Product', slug: 'product', totalBlogs: 8, createdAt: '2023-02-20T14:30:00Z' },
  { id: '3', name: 'Design', slug: 'design', totalBlogs: 5, createdAt: '2023-03-05T09:15:00Z' },
  { id: '4', name: 'Company News', slug: 'company-news', totalBlogs: 4, createdAt: '2023-04-10T11:45:00Z' },
  { id: '5', name: 'Tutorials', slug: 'tutorials', totalBlogs: 15, createdAt: '2023-05-22T16:20:00Z' },
  { id: '6', name: 'Performance', slug: 'performance', totalBlogs: 7, createdAt: '2023-06-18T13:10:00Z' },
  { id: '7', name: 'Security', slug: 'security', totalBlogs: 6, createdAt: '2023-07-30T08:50:00Z' },
  { id: '8', name: 'Open Source', slug: 'open-source', totalBlogs: 9, createdAt: '2023-08-12T15:35:00Z' },
  { id: '9', name: 'Career', slug: 'career', totalBlogs: 3, createdAt: '2023-09-25T10:40:00Z' },
  { id: '10', name: 'AI & Data', slug: 'ai-data', totalBlogs: 11, createdAt: '2023-10-08T12:25:00Z' }
];

export const mockBlogs: Blog[] = [
  {
    id: 'b1',
    title: 'Migrating from Webpack to Vite: A Complete Guide',
    slug: 'migrating-webpack-to-vite',
    excerpt: 'Learn how we reduced our build times by 80% by switching our primary frontend tooling from Webpack to Vite.',
    content: '<h1>Migrating from Webpack to Vite</h1><p>Our journey to faster builds...</p>',
    category: 'Engineering',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
    createdAt: '2023-11-01T09:00:00Z',
    updatedAt: '2023-11-02T10:30:00Z',
    readingTime: '8 min',
    tags: ['react', 'vite', 'webpack', 'tooling']
  },
  {
    id: 'b2',
    title: 'The Future of React Server Components',
    slug: 'future-of-react-server-components',
    excerpt: 'An deep dive into React Server Components (RSC) and how they fundamentally change how we build React applications.',
    content: '<h1>React Server Components</h1><p>Server components allow us to...</p>',
    category: 'Engineering',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    createdAt: '2023-11-15T14:20:00Z',
    updatedAt: '2023-11-15T14:20:00Z',
    readingTime: '12 min',
    tags: ['react', 'rsc', 'nextjs', 'architecture']
  },
  {
    id: 'b3',
    title: 'Building a Design System with Tailwind CSS and Radix UI',
    slug: 'building-design-system-tailwind-radix',
    excerpt: 'How to construct an accessible, highly customizable design system using utility classes and headless UI components.',
    content: '<h1>Accessible Design Systems</h1><p>Start with a strong foundation...</p>',
    category: 'Design',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Michael Ross', avatar: 'https://i.pravatar.cc/150?u=michael' },
    createdAt: '2023-12-05T11:15:00Z',
    updatedAt: '2023-12-06T09:45:00Z',
    readingTime: '10 min',
    tags: ['css', 'tailwind', 'radix', 'accessibility']
  },
  {
    id: 'b4',
    title: 'Announcing our New API v2',
    slug: 'announcing-api-v2',
    excerpt: 'Today we are thrilled to announce the stable release of our API v2, featuring GraphQL support and improved rate limits.',
    content: '<h2>What is new in v2?</h2><p>We completely rewrote...</p>',
    category: 'Product',
    status: 'draft',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Elena Rodriguez', avatar: 'https://i.pravatar.cc/150?u=elena' },
    createdAt: '2024-01-10T16:00:00Z',
    updatedAt: '2024-01-12T13:20:00Z',
    readingTime: '5 min',
    tags: ['api', 'release', 'graphql']
  },
  {
    id: 'b5',
    title: 'Why We Dropped Kubernetes for a PaaS',
    slug: 'why-we-dropped-kubernetes',
    excerpt: 'A controversial take on why managing your own Kubernetes cluster might be overkill for early-stage startups.',
    content: '<h1>Saying Goodbye to K8s</h1><p>It was a difficult decision...</p>',
    category: 'Engineering',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'David Kim', avatar: 'https://i.pravatar.cc/150?u=david' },
    createdAt: '2024-02-22T08:30:00Z',
    updatedAt: '2024-02-23T11:10:00Z',
    readingTime: '15 min',
    tags: ['infrastructure', 'devops', 'kubernetes', 'startup']
  },
  {
    id: 'b6',
    title: 'Optimizing Core Web Vitals in 2024',
    slug: 'optimizing-core-web-vitals',
    excerpt: 'A comprehensive guide to fixing CLS, LCP, and FID issues on heavy content sites.',
    content: '<h1>Core Web Vitals Guide</h1><p>Performance is a feature...</p>',
    category: 'Performance',
    status: 'archived',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
    createdAt: '2022-10-15T09:00:00Z',
    updatedAt: '2022-11-01T10:00:00Z',
    readingTime: '9 min',
    tags: ['seo', 'performance', 'metrics']
  },
  {
    id: 'b7',
    title: 'Zero Trust Security for Distributed Teams',
    slug: 'zero-trust-security-distributed-teams',
    excerpt: 'Implementing a zero-trust model when your workforce spans across 15 different time zones.',
    content: '<h1>Beyond the VPN</h1><p>The perimeter is dead...</p>',
    category: 'Security',
    status: 'draft',
    coverImage: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Marcus Wright', avatar: 'https://i.pravatar.cc/150?u=marcus' },
    createdAt: '2024-03-05T14:45:00Z',
    updatedAt: '2024-03-10T09:20:00Z',
    readingTime: '11 min',
    tags: ['security', 'remote-work', 'zero-trust']
  },
  {
    id: 'b8',
    title: 'Introducing AI Code Assistant',
    slug: 'introducing-ai-code-assistant',
    excerpt: 'Meet our new AI-powered developer tool that writes boilerplate so you do not have to.',
    content: '<h1>AI meets your IDE</h1><p>Let the robots do the typing...</p>',
    category: 'Company News',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2024-04-12T10:00:00Z',
    readingTime: '6 min',
    tags: ['ai', 'product', 'announcement']
  },
  {
    id: 'b9',
    title: 'Mastering TypeScript Generics',
    slug: 'mastering-typescript-generics',
    excerpt: 'A visual guide to understanding how generics work in TypeScript with real-world examples.',
    content: '<h1>Generics Explained</h1><p>Think of generics as variables for types...</p>',
    category: 'Tutorials',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'Elena Rodriguez', avatar: 'https://i.pravatar.cc/150?u=elena' },
    createdAt: '2024-05-01T11:30:00Z',
    updatedAt: '2024-05-02T08:15:00Z',
    readingTime: '14 min',
    tags: ['typescript', 'tutorial', 'learning']
  },
  {
    id: 'b10',
    title: 'Lessons Learned Scaling our Postgres Database',
    slug: 'lessons-scaling-postgres',
    excerpt: 'What we learned when our primary database crossed the 10TB mark and how we handled the migration.',
    content: '<h1>Postgres at Scale</h1><p>When indexes are no longer enough...</p>',
    category: 'Engineering',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=800&h=400',
    author: { name: 'David Kim', avatar: 'https://i.pravatar.cc/150?u=david' },
    createdAt: '2024-05-20T09:45:00Z',
    updatedAt: '2024-05-21T14:10:00Z',
    readingTime: '16 min',
    tags: ['database', 'postgres', 'scaling', 'backend']
  }
];

// Add 10 more to reach 20 as requested
for (let i = 11; i <= 20; i++) {
  mockBlogs.push({
    id: `b${i}`,
    title: `Sample Developer Article ${i}: Deep Dive into Web Technologies`,
    slug: `sample-developer-article-${i}`,
    excerpt: `This is a generated excerpt for article ${i}. It covers important topics relevant to modern software engineering and architecture.`,
    content: `<h1>Article ${i}</h1><p>Sample content goes here...</p>`,
    category: mockCategories[i % mockCategories.length].name,
    status: i % 4 === 0 ? 'draft' : i % 7 === 0 ? 'archived' : 'published',
    coverImage: `https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=400&sig=${i}`,
    author: { name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=jane' },
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    readingTime: `${(i % 10) + 4} min`,
    tags: ['sample', 'auto-generated']
  });
}

export const mockMedia: Media[] = Array.from({ length: 40 }).map((_, i) => ({
  id: `m${i}`,
  url: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=400&h=300&sig=${i}`,
  filename: `upload_image_${i + 1}.jpg`,
  size: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)} MB`,
  uploadedAt: new Date(Date.now() - (Math.random() * 10000000000)).toISOString()
}));
