"use client";

import { useState, useCallback } from "react";
import { sendChatMessage } from "@/api/chat";
import type { ChatHistoryItem, ChatMessage, ChatContext } from "@/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (message: string, owner?: string, repo?: string, context?: ChatContext) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      setError(null);

      const history: ChatHistoryItem[] = messages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const answer = await sendChatMessage(message, owner, repo, history, context);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to get response";
        setError(msg);
      } finally {
        setSending(false);
      }
    },
    [messages]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sending, error, send, clear };
}
