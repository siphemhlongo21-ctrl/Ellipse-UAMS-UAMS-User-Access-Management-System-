/**
 * HTTP client for Ellipse API v1.
 * Auth: Bearer (Entra) and/or X-AD-Username (manual), via shared client.ts identity.
 */

import {
  ApiError,
  getAuthToken,
} from "./client";

export { ApiError };


function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const base = import.meta.env.VITE_API_BASE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;

  // Callers pass `/api/Controller/...`. Avoid `/api` + `/api/...` → `/api/api/...`.
  let absolute: string;
  if (!base || base === "/api") {
    absolute = normalized.startsWith("/api") ? normalized : `/api${normalized}`;
  } else if (/^https?:\/\//i.test(base)) {
    const withoutApi = normalized.replace(/^\/api(?=\/|$)/, "");
    absolute = `${base}${withoutApi}`;
  } else {
    const withoutApi = normalized.replace(/^\/api(?=\/|$)/, "");
    absolute = `${base}${withoutApi}`;
  }

  const url = absolute.startsWith("http")
    ? new URL(absolute)
    : new URL(absolute, window.location.origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function messageFromPayload(payload: unknown, status: number, path: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim().replace(/^"|"$/g, "");
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
    if (typeof obj.title === "string" && obj.title.trim()) return obj.title;
    if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail;
  }
  return `API ${status} for ${path}`;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = getAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Network request failed.";
    throw new ApiError(
      0,
      /failed to fetch|networkerror|load failed/i.test(detail)
        ? "Could not reach the API."
        : detail,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("json") || contentType.includes("text/plain");
  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFromPayload(payload, response.status, path),
      payload,
    );
  }

  // Some endpoints return bare booleans as text/plain
  if (!isJson && typeof payload === "string") {
    if (payload === "true") return true as T;
    if (payload === "false") return false as T;
  }

  return payload as T;
}

export function useApiMocks(): boolean {
  return String(import.meta.env.VITE_USE_API_MOCKS ?? "false").toLowerCase() === "true";
}
