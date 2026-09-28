"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useChat } from "@/hooks/use-chat";
import { useRepositories } from "@/hooks/use-repositories";
import { useAccountStats } from "@/hooks/use-account-stats";
import { buildAccountChatContext } from "@/lib/utils";
import type { RepoLite, ReportTone } from "@/types";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { messages, sending, send } = useChat();
  const { stats, repos: accountRepos, fetchAccount } = useAccountStats(false);
  const {
    data: repoData,
    fetchRepositories,
  } = useRepositories();
  const [selectedRepo, setSelectedRepo] = useState<RepoLite | null>(null);
  const [tone, setTone] = useState<ReportTone>("mentor");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAccount();
      fetchRepositories(1, 100);
    }
  }, [user, fetchAccount, fetchRepositories]);

  const context = useMemo(
    () => (stats ? buildAccountChatContext(stats, repoData?.repos ?? accountRepos) : undefined),
    [stats, repoData, accountRepos]
  );

  const handleSend = (message: string) => {
    send(
      message,
      selectedRepo?.owner,
      selectedRepo?.name,
      context,
      tone
    );
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const repositoryOptions = repoData?.repos ?? [];

  return (
    <AppShell title="Ask FlowLens">
      <div className="max-w-3xl mx-auto">
        <ChatInterface
          messages={messages}
          sending={sending}
          onSend={handleSend}
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
          repos={repositoryOptions}
          tone={tone}
          onToneChange={setTone}
          contextLabel={
            selectedRepo
              ? `${selectedRepo.owner}/${selectedRepo.name}`
              : `@${user.username}`
          }
        />
      </div>
    </AppShell>
  );
}
