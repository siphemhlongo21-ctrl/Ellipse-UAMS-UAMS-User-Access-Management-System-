import { apiRequest, getApiBaseUrl, getAdUsername } from "./http";
import type { DocumentDetails } from "./types";

export function getRequestDocuments(requestId: number, signal?: AbortSignal) {
  return apiRequest<DocumentDetails[]>("/api/Documents/GetRequestDocument", {
    query: { requestId },
    signal,
  });
}

export function getDocumentById(id: number, signal?: AbortSignal) {
  return apiRequest<DocumentDetails>("/api/Documents/GetDocumentById", {
    query: { id },
    signal,
  });
}

export function createDocument(body: DocumentDetails) {
  return apiRequest<DocumentDetails>("/api/Documents/CreateDocument", {
    method: "POST",
    body,
  });
}

export function archiveDocument(id: number) {
  return apiRequest<boolean>("/api/Documents/ArchiveDocument", {
    method: "PUT",
    query: { id },
  });
}

export function deleteDocument(id: number) {
  return apiRequest<boolean>("/api/Documents/DeleteDocument", {
    method: "DELETE",
    query: { id },
  });
}

/** Download via browser navigation so auth header can be applied through fetch+blob. */
export async function downloadDocument(id: number, fileName = "document"): Promise<void> {
  const base = getApiBaseUrl();
  const path = `/api/Documents/DownloadDocument?id=${id}`;
  // Same rules as http.buildUrl: never produce /api/api/...
  const url =
    !base || base === "/api"
      ? path
      : `${base}${path.replace(/^\/api(?=\/|$)/, "")}`;

  const headers: Record<string, string> = { Accept: "*/*" };
  const adUsername = getAdUsername();
  if (adUsername) headers["X-AD-Username"] = adUsername;

  const response = await fetch(
    url.startsWith("http") ? url : new URL(url, window.location.origin).toString(),
    { headers },
  );
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

/** Read file as base64 (without data: URL prefix) for DocumentDetails.data */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
