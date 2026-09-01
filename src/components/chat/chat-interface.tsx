"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, User, Brain, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, RepoLite } from "@/types";

const accountPrompts = [
  "Which repository needs attention?",
  "What should I focus on this week?",
  "What are my strongest areas?",
  "How can I improve my consistency?",
  "What does my recent activity suggest?",
];

const repoPrompts = [
  "What is the state of this repository?",
  "Which areas of this repo need work?",
  "Summarize recent activity in this repo.",
  "What does the code here look like?",
  "How should I improve this repository?",
];

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-surface px-1.5 py-0.5 text-[0.85em] text-accent">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-2 rounded-md bg-surface p-3 overflow-x-auto text-xs">{children}</pre>
          ),
          h1: ({ children }) => <h1 className="text-base font-semibold mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 mt-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left font-semibold text-text-primary px-2 py-1.5">{children}</th>
          ),
          td: ({ children }) => <td className="px-2 py-1.5 border-b border-border/50 align-top">{children}</td>,
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : ""
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-accent-subtle" : "bg-surface-secondary"
        )}
      >
        {isUser ? (
          <User size={14} className="text-accent" />
        ) : (
          <Brain size={14} className="text-text-muted" />
        )}
      </div>
      <div
        className={cn(
          "rounded-[var(--radius-md)] px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-accent text-white"
            : "bg-surface-secondary text-text-secondary border border-border"
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <Markdown content={message.content} />
        )}
      </div>
    </div>
  );
}

export function ChatInterface({
  messages,
  sending,
  onSend,
  selectedRepo,
  onSelectRepo,
  repos,
  contextLabel,
}: {
  messages: ChatMessage[];
  sending: boolean;
  onSend: (message: string) => void;
  selectedRepo: RepoLite | null;
  onSelectRepo: (repo: RepoLite | null) => void;
  repos: RepoLite[];
  contextLabel?: string;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setInput("");
  };

  const handleSuggestion = (prompt: string) => {
    if (!sending) onSend(prompt);
  };

  const suggestedPrompts = selectedRepo ? repoPrompts : accountPrompts;

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            Ask FlowLens
          </CardTitle>
          <Select
            value={selectedRepo?.full_name ?? "all"}
            onValueChange={(value) =>
              onSelectRepo(repos.find((r) => r.full_name === value) ?? null)
            }
          >
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Entire account</SelectItem>
              {repos.map((repo) => (
                <SelectItem key={repo.id} value={repo.full_name}>
                  {repo.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {contextLabel && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
            <FolderGit2 size={12} />
            <span>
              Analyzing <span className="font-medium text-text-secondary">{contextLabel}</span>
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted mx-auto mb-3">
                <Brain size={20} />
              </div>
              <p className="text-sm text-text-secondary mb-1">
                {selectedRepo
                  ? `Ask FlowLens anything about ${selectedRepo.full_name}.`
                  : "Ask FlowLens anything about your GitHub account."}
              </p>
              <p className="text-xs text-text-muted">
                {selectedRepo
                  ? "From commits and code health to what to fix next in this repo."
                  : "From commits and repos to strengths and what to focus on next."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestion(prompt)}
                  disabled={sending}
                  className="rounded-full border border-border bg-surface-secondary px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin pr-1">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                  <Brain size={14} className="text-text-muted" />
                </div>
                <div className="rounded-[var(--radius-md)] px-4 py-3 bg-surface-secondary border border-border">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedRepo
                ? `Ask about ${selectedRepo.name}...`
                : "Ask about your GitHub account..."
            }
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending}>
            <Send size={16} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
