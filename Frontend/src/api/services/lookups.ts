import { http } from "../client";
import type {
  DepartmentDetails,
  BranchDetails,
  RequestTypeDetails,
  EllipsePositionDetails,
} from "../types";

export const lookupsApi = {
  // Departments
  createDepartment: (data: DepartmentDetails) =>
    http.post<DepartmentDetails>("/Lookups/CreateDepartment", { body: data }),
  updateDepartment: (data: DepartmentDetails) =>
    http.put<DepartmentDetails>("/Lookups/UpdateDepartment", { body: data }),
  deactivateDepartment: (id: number) =>
    http.delete<boolean>("/Lookups/DeactivateDepartment", { params: { id } }),

  // Branches
  createBranch: (data: BranchDetails) =>
    http.post<BranchDetails>("/Lookups/CreateBranch", { body: data }),
  updateBranch: (data: BranchDetails) =>
    http.put<BranchDetails>("/Lookups/UpdateBranch", { body: data }),
  deactivateBranch: (id: number) =>
    http.delete<boolean>("/Lookups/DeactivateBranch", { params: { id } }),

  // Request Types
  getRequestTypes: () =>
    http.get<RequestTypeDetails[]>("/Lookups/GetRequestTypes"),
  createRequestType: (data: RequestTypeDetails) =>
    http.post<RequestTypeDetails>("/Lookups/CreateRequestType", { body: data }),
  updateRequestType: (data: RequestTypeDetails) =>
    http.put<RequestTypeDetails>("/Lookups/UpdateRequestType", { body: data }),

  // Ellipse Positions
  getEllipsePositions: () =>
    http.get<EllipsePositionDetails[]>("/Lookups/GetEllipsePositions"),
  createEllipsePosition: (data: EllipsePositionDetails) =>
    http.post<EllipsePositionDetails>("/Lookups/CreateEllipsePosition", { body: data }),
  updateEllipsePosition: (data: EllipsePositionDetails) =>
    http.put<EllipsePositionDetails>("/Lookups/UpdateEllipsePosition", { body: data }),
};
