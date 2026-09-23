import { http } from "../client";
import type { ContractorDetails } from "../types";

export const contractorApi = {
  getAll: () => http.get<ContractorDetails[]>("/Contractor"),

  getById: (id: number) => http.get<ContractorDetails>(`/Contractor/${id}`),

  create: (data: ContractorDetails) =>
    http.post<ContractorDetails>("/Contractor", { body: { ...data, requests: data.requests ?? [] } }),

  update: (data: ContractorDetails) =>
    http.put<void>("/Contractor", { body: { ...data, requests: data.requests ?? [] } }),

  delete: (id: number) => http.delete<void>(`/Contractor/${id}`),
};
