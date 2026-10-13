/**
 * Base URL for browser API calls.
 * Production (Vercel): empty string → same-origin `/api/*` (proxied to backend via next.config rewrites).
 * Local dev: set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:5050).
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw === undefined || raw === null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed.replace(/\/$/, "");
}

/** Build a full API path, e.g. apiUrl("/api/auth/me") → "/api/auth/me" or "http://localhost:5050/api/auth/me" */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
