import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tag,
  Settings,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Blogs", href: "/blogs", icon: FileText },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Tags", href: "/tags", icon: Tag },
  { name: "Inquiries", href: "/inquiries", icon: Mail },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r border-border/55 bg-background/80 dark:bg-card/40 backdrop-blur-xl shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="">
            <img src="/digipie_logo.png" alt="" className="w-6 h-auto" />
          </div>
          Digipie CMS
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                  isActive
                    ? "bg-accent/50 text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
