import { http } from "../client";
import type { DepartmentDetails } from "../types";

export const departmentsApi = {
  getAll: () => http.get<DepartmentDetails[]>("/Departments/GetAll"),

  getById: (id: number) =>
    http.get<DepartmentDetails>("/Departments/GetById", { params: { id } }),
};
