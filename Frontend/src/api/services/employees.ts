import { http } from "../client";
import { apiRequest } from "../http";
import type { EmployeeDetails, EmployeeManagerDetails, USTEmployeeDetails } from "../types";

export type UstEmployeeDetails = {
  serviceNo: string;
  surname: string;
  email: string;
  firstName: string;
  userId: string;
  postNo: string;
  deptDesc: string;
  branchDesc: string;
  designation: string;
};

export const employeeApi = {
  getByEmail: (email: string) =>
    http.get<EmployeeDetails>("/Employee", { params: { email } }),

  create: (data: EmployeeDetails) =>
    http.post<EmployeeDetails>("/Employee", { body: data }),

  update: (data: EmployeeDetails) =>
    http.put<void>("/Employee", { body: data }),

  delete: (email: string) =>
    http.delete<void>("/Employee", { params: { email } }),
};

export const lookupUSTEmployeeApi = {
  getEmployee: (identifier: string) =>
    apiRequest<USTEmployeeDetails>("/api/LookupUSTEmployee/GetEmployee", {
      query: { identifier },
    }),

  getEmployees: (searchString: string) =>
    apiRequest<USTEmployeeDetails[]>("/api/LookupUSTEmployee/GetEmployees", {
      query: { searchString },
    }),
};

export const employeeManagersApi = {
  getByManager: (managerEmployeeEmail: string) =>
    http.get<EmployeeManagerDetails[]>("/EmployeeManagers/GetByManager", {
      params: { managerEmployeeEmail },
    }),

  assign: (data: EmployeeManagerDetails) =>
    http.post<EmployeeManagerDetails>("/EmployeeManagers/Assign", { body: data }),

  deactivate: (id: number) =>
    http.post<boolean>("/EmployeeManagers/Deactivate", { params: { id } }),
};

export const ustEmployeeApi = {
  getTeamByManagerServiceNumber: (serviceNumber: string) =>
    http.get<UstEmployeeDetails[]>(
      "/LookupUSTEmployee/GetEmployeesReportingToManagerByManagerServiceNumber", 
      { params: { serviceNumber } }
    ),
};
