import { useParams, Link } from 'react-router-dom';
import { mockBlogs } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BlogPreview() {
  const { id } = useParams();
  const blog = mockBlogs.find(b => b.id === id) || mockBlogs[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar just for admin */}
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to="/blogs"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="text-sm font-medium">Preview Mode</span>
        </div>
        <Button asChild size="sm">
          <Link to={`/blogs/${blog.id}`}>Edit Post</Link>
        </Button>
      </div>

      <article className="max-w-3xl mx-auto py-16 px-6 sm:px-8">
        <header className="mb-12 text-center">
          <div className="mb-6 flex justify-center gap-2 text-sm text-primary font-medium tracking-wide uppercase">
            <span>{blog.category}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance">
            {blog.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
            {blog.excerpt}
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <img src={blog.author.avatar} alt={blog.author.name} className="w-10 h-10 rounded-full" />
            <div className="text-left">
              <div className="font-medium text-foreground">{blog.author.name}</div>
              <div className="text-muted-foreground">
                {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · {blog.readingTime} read
              </div>
            </div>
          </div>
        </header>

        <figure className="mb-16 rounded-2xl overflow-hidden shadow-xl shadow-black/5 ring-1 ring-border/50">
          <img src={blog.coverImage} alt={blog.title} className="w-full object-cover aspect-[2/1]" />
        </figure>

        <div className="prose prose-lg dark:prose-invert prose-headings:font-semibold prose-a:text-primary mx-auto">
          <div dangerouslySetInnerHTML={{ __html: blog.content || '<p>No content available.</p>' }} />
          
          {/* Mock additional content for preview length */}
          <p>
            When building complex interfaces, we often run into the challenge of managing state effectively while keeping the UI responsive. The architecture we chose allows for a seamless integration between our core services and the client application.
          </p>
          <h2>The approach we took</h2>
          <p>
            By leveraging modern web standards, we were able to reduce the bundle size significantly. Here is a breakdown of the key metrics we monitored during the rollout:
          </p>
          <ul>
            <li>First Contentful Paint (FCP) improved by 40%</li>
            <li>Time to Interactive (TTI) was cut in half</li>
            <li>Overall memory footprint on the client side was reduced</li>
          </ul>
          <blockquote>
            "The simplicity of the new system allowed our team to ship features twice as fast as before."
          </blockquote>
          <p>
            Moving forward, we plan to open source several of the internal tools we built to support this migration. Stay tuned for more updates!
          </p>
        </div>
        
        <hr className="my-16 border-border" />
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-16">
          {blog.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm hover:bg-muted/80 cursor-pointer transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
