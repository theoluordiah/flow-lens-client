"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Activity,
  FolderGit2,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  SquareTerminal,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import type { User } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, group: "Overview" },
  { label: "Activity", href: "/activity", icon: <Activity size={18} />, group: "Analytics" },
  { label: "Repositories", href: "/repositories", icon: <FolderGit2 size={18} />, group: "Analytics" },
  { label: "Ask FlowLens", href: "/chat", icon: <MessageSquare size={18} />, group: "Tools" },
  { label: "Profile Builder", href: "/profile-builder", icon: <SquareTerminal size={18} />, group: "Tools" },
  { label: "GitHub", href: "/github", icon: <GithubIcon width={18} height={18} />, group: "Account" },
  { label: "Settings", href: "/settings", icon: <Settings size={18} />, group: "Account" },
];

function SidebarContent({ user, collapsed }: { user: User | null; collapsed: boolean }) {
  const pathname = usePathname();
  const groups = Array.from(new Set(navItems.map((item) => item.group)));

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-5")}>
        {collapsed ? (
          <span className="text-lg font-bold text-text-primary tracking-tight">F</span>
        ) : (
          <span className="text-sm font-bold text-text-primary tracking-tight uppercase">FlowLens</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {groups.map((group) => (
          <div key={group} className="mb-2">
            {!collapsed && (
              <div className="px-5 py-1.5">
                <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  {group}
                </span>
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {navItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const button = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-all duration-150 relative",
                        isActive
                          ? "bg-surface-secondary text-text-primary"
                          : "text-text-secondary hover:bg-surface-secondary/50 hover:text-text-primary",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-accent" />
                      )}
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return button;
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        {user && (
          <div className={cn("flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2", collapsed && "justify-center")}>
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatarUrl} alt={user.username} />
              <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{user.username}</p>
                <p className="text-[11px] text-text-muted">GitHub Connected</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppSidebar({ user }: { user: User | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-background border-r border-border transform transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent user={user} collapsed={false} />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-background transition-all duration-200 relative",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent user={user} collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-secondary text-text-muted hover:text-text-primary transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-30 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface text-text-secondary hover:text-text-primary lg:hidden"
        aria-label="Open menu"
      >
        <PanelLeft size={18} />
      </button>
    </>
  );
}
