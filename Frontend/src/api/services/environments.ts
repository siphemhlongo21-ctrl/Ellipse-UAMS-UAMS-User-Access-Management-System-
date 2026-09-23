import { http } from "../client";
import type { EnvironmentDetails } from "../types";

export const environmentsApi = {
  getAll: () => http.get<EnvironmentDetails[]>("/Environments/GetAll"),

  getById: (id: number) =>
    http.get<EnvironmentDetails>("/Environments/GetById", { params: { id } }),

  create: (data: EnvironmentDetails) =>
    http.post<EnvironmentDetails>("/Environments/Create", { body: data }),

  update: (data: EnvironmentDetails) =>
    http.put<EnvironmentDetails>("/Environments/Update", { body: data }),

  delete: (id: number) =>
    http.delete<boolean>("/Environments/Delete", { params: { id } }),
};
