"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, LogOut, User, Settings, Command } from "lucide-react";
import type { User as UserType } from "@/types";

interface SiteHeaderProps {
  title: string;
  user: UserType | null;
  onCommandOpen: () => void;
  onLogout: () => void;
}

export function SiteHeader({ title, user, onCommandOpen, onLogout }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6 transition-colors",
        scrolled && "border-border"
      )}
    >
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCommandOpen}
          className="flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-secondary px-3 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline">
            <Command size={10} className="inline" /> K
          </kbd>
        </button>

        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell size={16} />
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-text-primary">{user.username}</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User size={14} className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings size={14} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut size={14} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
