import { Home, List, FolderGit2, Users, BrainCircuit, PlusCircle, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reviews", label: "Reviews", icon: List },
    { href: "/projects", label: "Projects", icon: FolderGit2 },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/memory", label: "Memory", icon: BrainCircuit },
  ];

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <BrainCircuit className="w-6 h-6" />
          CodeSense
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link href="/reviews/new" className="w-full block">
          <Button className="w-full flex items-center justify-start gap-2">
            <PlusCircle className="w-4 h-4" />
            New Review
          </Button>
        </Link>
      </div>
    </div>
  );
}
