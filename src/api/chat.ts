import client from "./client";
import type { ChatHistoryItem, ChatMessage, ChatContext } from "@/types";

export async function sendChatMessage(
  message: string,
  owner?: string,
  repo?: string,
  history?: ChatHistoryItem[],
  context?: ChatContext
): Promise<string> {
  const body: Record<string, unknown> = { message };
  if (owner) body.owner = owner;
  if (repo) body.repo = repo;
  if (history && history.length > 0) body.history = history;
  if (context) body.context = context;
  const { data } = await client.post<{ answer: string }>("/api/chat", body);
  return data.answer;
}

export async function getChatHistory(
  _repo?: string
): Promise<ChatMessage[]> {
  void _repo;
  // The API spec does not provide a chat history endpoint;
  // conversation is maintained client-side via the `history` field.
  return [];
}
