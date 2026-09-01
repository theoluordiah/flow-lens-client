"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { CommandMenu } from "./command-menu";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { user, logout } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar user={user} />
      <div className="flex flex-1 flex-col min-w-0">
        <SiteHeader
          title={title}
          user={user}
          onCommandOpen={() => setCommandOpen(true)}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
