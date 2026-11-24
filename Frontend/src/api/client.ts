import type { AuthResponse } from "../types/AuthResponse";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AD_HEADER = "X-AD-Username";

let email: string | null = import.meta.env.DEV
  ? import.meta.env.VITE_DEV_AD_USERNAME?.trim() || null
  : null;
let bearerToken: string | null = null;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const absolute =
    /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(absolute, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const token = sessionStorage.getItem("access_token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const username = email ?? sessionStorage.getItem("email");
  if (!token && username) {
    headers[AD_HEADER] = username;
  }

  return headers;
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.params);
  const headers = { ...getAuthHeaders(), ...options.headers };
  if (!options.body) {
    delete headers["Content-Type"];
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new ApiError(res.status, errorBody || res.statusText, errorBody);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return undefined as unknown as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
  patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
};

export async function uploadFile(
  path: string,
  formData: FormData,
): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = bearerToken ?? sessionStorage.getItem("access_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const username = email ?? sessionStorage.getItem("email");
    if (username) headers[AD_HEADER] = username;
  }

  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new ApiError(res.status, errorBody || res.statusText, errorBody);
  }

  return res;
}

export async function employeeLogin(
  path: string,
): Promise<AuthResponse> {
  const headers: Record<string, string> = {};
  const token = bearerToken ?? sessionStorage.getItem("access_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(resolveUrl(path), {
    method: "POST"
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new ApiError(res.status, errorBody || res.statusText, errorBody);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<AuthResponse>;
  }

  return undefined as unknown as AuthResponse;
}

export function setEmail(email: string | null): void {
  email = email?.trim() || null;
  if (email) {
    sessionStorage.setItem("email", email);
  } else {
    sessionStorage.removeItem("email");
  }
}

export function getEmail(): string | null {
  return email ?? sessionStorage.getItem("email");
}

export function setAuthToken(token: string | null): void {
  bearerToken = token?.trim() || null;

  if (bearerToken) {
    sessionStorage.setItem("access_token", bearerToken);
  } else {
    sessionStorage.removeItem("access_token");
  }
}

export function getAuthToken(): string | null {
  return bearerToken ?? sessionStorage.getItem("access_token");
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  } else if (email) {
    headers.set(AD_HEADER, email);
  }

  return headers;
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL === "/api") {
    return normalizedPath.startsWith("/api")
      ? normalizedPath
      : `/api${normalizedPath}`;
  }

  const pathWithoutApiPrefix = normalizedPath.replace(/^\/api(?=\/|$)/, "");
  return `${API_BASE_URL}${pathWithoutApiPrefix}`;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  rawBody?: boolean;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, rawBody, headers: initHeaders, ...rest } = options;
  const headers = buildHeaders(initHeaders);

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (rawBody) {
      payload = body as BodyInit;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(resolveUrl(path), {
    ...rest,
    headers,
    body: payload,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "string" && data
        ? data
        : (data as { title?: string; message?: string } | null)?.message ||
        (data as { title?: string; message?: string } | null)?.title ||
        response.statusText ||
        `HTTP ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

/** Authenticated binary download (documents). */
export async function apiDownloadBlob(
  path: string,
): Promise<{ blob: Blob; fileName: string }> {

  if (!bearerToken) bearerToken = sessionStorage.getItem("access_token");

  const headers = buildHeaders();
  const response = await fetch(resolveUrl(path), { method: "GET", headers });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(response.status, text || response.statusText);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
  const fileName = match
    ? decodeURIComponent(match[1].replace(/"/g, "").trim())
    : "download";
  const blob = await response.blob();
  return { blob, fileName };
}

export const api = {
  get: <T>(path: string, init?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...init, method: "POST", body }),
  put: <T>(path: string, body?: unknown, init?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...init, method: "PUT", body }),
  delete: <T>(path: string, init?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...init, method: "DELETE" }),
};