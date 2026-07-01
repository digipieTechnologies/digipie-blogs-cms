import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Image as ImageIcon, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link as LinkIcon, Table, Undo, Redo, LayoutPanelLeft, Heading1, Heading2, Heading3, ChevronDown, CheckSquare, Minus, Check } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { mockBlogs } from '@/data/mock';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  const existingBlog = isEditing ? mockBlogs.find(b => b.id === id) : null;

  const [title, setTitle] = useState(existingBlog?.title || '');
  const [content, setContent] = useState(existingBlog?.content || '');

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Editor Topbar */}
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => navigate('/blogs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Draft</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="font-medium truncate max-w-[200px]">{title || 'Untitled'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground mr-2">Saved just now</span>
          <Button variant="outline" size="sm" className="bg-background">Preview</Button>
          <Button size="sm">Publish</Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[800px] mx-auto py-12 px-8">
            
            {/* Cover Image Upload (Mock) */}
            <div className="group relative w-full h-64 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center text-muted-foreground transition-colors hover:bg-muted/40 hover:border-primary/50 cursor-pointer overflow-hidden mb-10">
              {existingBlog?.coverImage ? (
                <>
                  <img src={existingBlog.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">Change Cover</Button>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="font-medium">Add Cover Image</span>
                  <span className="text-xs mt-1 opacity-70">Recommended size: 1600x840px</span>
                </>
              )}
            </div>

            {/* Title Input */}
            <input
              type="text"
              placeholder="Post title..."
              className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 text-foreground mb-8 placeholder:font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* Sticky Toolbar Mock */}
            <div className="sticky top-6 z-20 mb-8 flex items-center gap-1 rounded-lg border border-border/50 bg-background/95 p-1 shadow-sm backdrop-blur">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                    Normal text <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem className="font-sans">Normal text</DropdownMenuItem>
                  <DropdownMenuItem className="text-2xl font-bold">Heading 1</DropdownMenuItem>
                  <DropdownMenuItem className="text-xl font-bold">Heading 2</DropdownMenuItem>
                  <DropdownMenuItem className="text-lg font-bold">Heading 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="w-px h-4 bg-border/50 mx-1"></div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground"><Bold className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Italic className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Underline className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Code className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><LinkIcon className="h-4 w-4" /></Button>
              
              <div className="w-px h-4 bg-border/50 mx-1"></div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><List className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ListOrdered className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><CheckSquare className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Quote className="h-4 w-4" /></Button>
              
              <div className="w-px h-4 bg-border/50 mx-1"></div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ImageIcon className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Table className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Minus className="h-4 w-4" /></Button>
              
              <div className="w-px h-4 bg-border/50 mx-1 ml-auto"></div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Undo className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Redo className="h-4 w-4" /></Button>
            </div>

            {/* Rich Text Area Mock */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none min-h-[400px] outline-none relative" 
              contentEditable 
              suppressContentEditableWarning
            >
              {isEditing ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <p className="text-muted-foreground/50">Start writing...</p>
              )}
            </div>

          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 border-l border-border/50 bg-background/30 p-6 overflow-y-auto hidden lg:block">
          <h3 className="font-medium mb-6 flex items-center gap-2"><LayoutPanelLeft className="h-4 w-4" /> Post Settings</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input placeholder="my-awesome-post" defaultValue={existingBlog?.slug} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="engineering">Engineering</option>
                <option value="product">Product</option>
                <option value="design">Design</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Excerpt</label>
              <textarea 
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A short summary of your post..."
                defaultValue={existingBlog?.excerpt}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input placeholder="Add tags separated by comma" defaultValue={existingBlog?.tags?.join(', ')} />
            </div>

            <div className="pt-4 border-t border-border/50 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">SEO</h4>
              <div className="space-y-2">
                <label className="text-xs font-medium">Meta Title</label>
                <Input placeholder="SEO Title" className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Meta Description</label>
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
  );
}
