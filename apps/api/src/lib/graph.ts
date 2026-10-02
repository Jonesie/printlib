import { GRAPH_API_BASE } from "../config.js";

// Thin wrapper over the Facebook/Instagram Graph API.
export async function graph<T>(
  pathname: string,
  init: { method?: "GET" | "POST"; body?: FormData | URLSearchParams; query?: Record<string, string> } = {},
): Promise<T> {
  const qs = init.query ? `?${new URLSearchParams(init.query)}` : "";
  const res = await fetch(`${GRAPH_API_BASE}/${pathname}${qs}`, {
    method: init.method ?? "GET",
    body: init.body,
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `Graph API request failed: ${res.status}`);
  }
  return data;
}
