import client from "./client";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User> {
  const { data } = await client.get("/api/auth/me");
  return data;
}

export async function getGitHubLoginUrl(): Promise<string> {
  // The endpoint returns a JSON body: { "url": "https://github.com/login/oauth/..." }.
  // We must NOT let axios/fetch follow the external redirect; instead we read the
  // URL from the JSON and navigate manually with window.location.href.
  const { data } = await client.get("/api/auth/github/start");
  if (typeof data === "string") return data;
  if (data && typeof data.url === "string") return data.url;
  throw new Error("GitHub login URL not returned by server");
}

export async function logout(): Promise<void> {
  // No server logout endpoint in the spec; token is cleared client-side.
  return;
}
