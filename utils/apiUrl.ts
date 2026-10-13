/** Live API origin (no trailing slash). */
export const PRODUCTION_API_ORIGIN = "https://backend.gulfestates.ae";

/**
 * Base URL for browser API calls (no trailing slash).
 * Production: `NEXT_PUBLIC_API_URL` → https://backend.gulfestates.ae (or same-origin `/api/*` if empty + proxy).
 * Local dev: set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:5050).
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw !== undefined && raw !== null) {
    const trimmed = String(raw).trim();
    if (trimmed && trimmed !== "undefined" && trimmed !== "null") {
      return trimmed.replace(/\/$/, "");
    }
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "admin.gulfestates.ae" || host.endsWith(".vercel.app")) {
      return PRODUCTION_API_ORIGIN;
    }
  }
  return "";
}

/** Build a full API path, e.g. apiUrl("/api/auth/me") → "/api/auth/me" or "http://localhost:5050/api/auth/me" */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
