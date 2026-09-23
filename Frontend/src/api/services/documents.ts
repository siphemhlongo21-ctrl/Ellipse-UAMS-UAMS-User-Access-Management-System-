import { http, uploadFile, apiDownloadBlob, API_BASE_URL } from "../client";
import type { DocumentDetails, DocumentAuditDetails } from "../types";

export const documentsApi = {
    upload: (requestId: number, documentType: string, documentCategory: string, file: File) => {
        const formData = new FormData();
        formData.append("requestId", String(requestId));
        formData.append("documentType", documentType);
        formData.append("documentCategory", documentCategory);
        formData.append("file", file);
        return uploadFile("/Documents/Upload", formData);
    },

    create: (data: DocumentDetails) =>
        http.post<DocumentDetails>("/Documents/CreateDocument", { body: data }),

    getById: (id: number) =>
        http.get<DocumentDetails>("/Documents/GetDocumentById", { params: { id } }),

    getByRequest: (requestId: number) =>
        http.get<DocumentDetails[]>("/Documents/GetRequestDocument", { params: { requestId } }),

    getArchivedByRequest: (requestId: number) =>
        http.get<DocumentDetails[]>("/Documents/GetArchivedRequestDocument", { params: { requestId } }),

    update: (data: DocumentDetails) =>
        http.put<DocumentDetails>("/Documents/UpdateDocument", { body: data }),

    delete: (id: number) =>
        http.delete<boolean>("/Documents/DeleteDocument", { params: { id } }),

    archive: (id: number) =>
        http.put<boolean>("/Documents/ArchiveDocument", { params: { id } }),

    restore: (id: number) =>
        http.put<boolean>("/Documents/RestoreDocument", { params: { id } }),

    getAuditTrail: (id: number) =>
        http.get<DocumentAuditDetails[]>("/Documents/GetDocumentAuditTrail", { params: { id } }),

    downloadUrl: (id: number) => `${API_BASE_URL}/Documents/DownloadDocument?id=${id}`,

    /**
     * The download endpoint is permission-protected, so browser-issued requests
     * (iframe/img/anchor) are rejected. Fetch the bytes with auth headers instead.
     */
    downloadBlob: (id: number) =>
        apiDownloadBlob(`/Documents/DownloadDocument?id=${id}`),
};