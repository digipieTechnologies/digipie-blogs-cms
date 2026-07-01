import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Settings() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your site preferences and configurations.</p>
      </div>

      <div className="space-y-6">
        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic details about your blog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site Name</label>
              <Input defaultValue="My Awesome Blog" className="max-w-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Site Description</label>
              <textarea 
                className="flex min-h-[80px] w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="A blog about modern web development and software engineering."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>SEO Optimization</CardTitle>
            <CardDescription>Default meta tags for search engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default SEO Title</label>
              <Input defaultValue="My Awesome Blog - Web Dev Articles" className="max-w-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default SEO Description</label>
              <textarea 
                className="flex min-h-[80px] w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="Explore in-depth articles about React, TypeScript, and modern tooling."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>Connect your social accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Twitter URL</label>
              <Input placeholder="https://twitter.com/yourhandle" className="max-w-md" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub URL</label>
              <Input placeholder="https://github.com/yourhandle" className="max-w-md" />
            </div>
          </CardContent>
        </Card>

        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <select className="flex h-10 w-full max-w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="bg-background">Cancel</Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
