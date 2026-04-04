/**
 * API base for browser fetches. Use `same-origin` with Next.js rewrites (see next.config.js)
 * so the UI works when opened from another host while the app proxies to the backend.
 */
export function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const trimmed = raw.trim();
  if (trimmed === "same-origin" || trimmed === "/api/backend") {
    return "/api/backend";
  }
  return trimmed.replace(/\/$/, "");
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = resolveApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const response = await fetch(url, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join("; ")
          : "Request failed.";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
