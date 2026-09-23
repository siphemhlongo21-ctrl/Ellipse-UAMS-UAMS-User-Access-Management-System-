import { http } from "../client";
import type { DocumentAuditDetails } from "../types";

export const documentAuditApi = {
  getById: (id: number) =>
    http.get<DocumentAuditDetails>("/DocumentAudit/GetDocumentAuditById", { params: { id } }),

  getByDocument: (documentId: number) =>
    http.get<DocumentAuditDetails[]>("/DocumentAudit/GetDocumentAuditsByDocument", {
      params: { documentId },
    }),

  getAll: () =>
    http.get<DocumentAuditDetails[]>("/DocumentAudit/GetAllDocumentAudits"),
};
