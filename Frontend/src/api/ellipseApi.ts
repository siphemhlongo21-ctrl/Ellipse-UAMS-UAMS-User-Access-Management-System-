/**
 * Typed calls against Ellipse.API (route: api/[controller]/[action]).
 */

import { api, apiDownloadBlob } from "./client";
import type { RequestDetails } from "./types";

export interface CurrentUserDetails {
  appUserId?: number | null;
  activeDirectoryUsername: string;
  email?: string | null;
  displayName?: string | null;
  employeeEmail?: string | null;
  roles: string[];
  permissions: string[];
}

export interface Phase1DashboardReport {
  generatedAtUtc: string;
  openRequests: number;
  returnForAmendmentCount: number;
  implementedLast30Days: number;
  rejectedLast30Days: number;
  byStatus: Array<{ status: string; count: number }>;
  byEnvironment: Array<{ environment: string; count: number }>;
  oldestOpenRequests: Array<{
    requestId: number;
    requestNumber?: string | null;
    status: string;
    environment?: string | null;
    requestedDate: string;
    ageDays: number;
  }>;
}

export interface DocumentDetails {
  id: number;
  requestId: number;
  documentType: string;
  documentCategory?: string | null;
  fileName?: string | null;
  storageKey?: string | null;
}

export interface EnvironmentDetails {
  id: number;
  name: string;
  requiresTraining: boolean;
}

export interface BranchDetails {
  id: number;
  name: string;
  isActive: boolean;
  departmentId?: number;
}

export interface DepartmentDetails {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  branches: BranchDetails[];
}

export interface RequestTypeDetails {
  id: number;
  code: string;
  name: string;
}

export interface EllipsePositionDetails {
  id: number;
  code: string;
  name: string;
  instance?: string | null;
  district?: string | null;
  isActive: boolean;
}

export interface ContractorDetails {
  id: number;
  identificationNumber: string;
  surname: string;
  firstName: string;
  emailAddress: string;
  companyName: string;
  responsibleManager: string;
  businessJustification: string;
  startDate: string;
  endDate: string;
  department: string;
  branch: string;
  active?: boolean;
}

export interface NewRequestDetails {
  requestType: string;
  environmentId?: number | null;
  environment?: string | null;
  userAccessType?: string | null;
  ellipsePosition: string;
  positionToCopy?: string | null;
  menuAccess: string;
  businessJustification: string;
  additionalUserAccess?: string | null;
  userType: string;
  employeeEmail?: string | null;
  firstName?: string | null;
  surname?: string | null;
  serviceNumber?: string | null;
  department?: string | null;
  branch?: string | null;
  designation?: string | null;
  contactNumber?: string | null;
  activeDirectoryUsername?: string | null;
  ellipseUserId?: number | null;
  postId?: number | null;
  contractId?: number | null;
  startDate: string;
  endDate?: string | null;
  submit?: boolean;
}

export interface FlowableTaskDto {
  taskId: string;
  name?: string | null;
  processInstanceId?: string | null;
  processDefinitionKey?: string | null;
  requestId?: number | null;
  assignee?: string | null;
  candidateGroups: string[];
  createTime?: string | null;
}

export interface FlowableHistoryEventDto {
  activityId?: string | null;
  activityName?: string | null;
  activityType?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface AccessRequestReportRow {
  requestId: number;
  requestNumber?: string | null;
  requestType: string;
  environment?: string | null;
  status: string;
  department?: string | null;
  employeeEmail?: string | null;
  contractId?: number | null;
  requestedDate: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ContractorAccessReportRow {
  requestId: number;
  requestNumber?: string | null;
  contractId: number;
  companyName: string;
  contractorName: string;
  environment?: string | null;
  status: string;
  contractStartDate?: string;
  contractEndDate?: string;
  accessState?: string;
}

export interface AppUserSummary {
  id: number;
  activeDirectoryUsername: string;
  email?: string | null;
  displayName?: string | null;
  isActive: boolean;
  employeeEmail?: string | null;
  serviceNumber?: string | null;
  roles: string[];
}

export interface RoleDetails {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  isSystemRole?: boolean;
  assignedUserCount?: number;
  permissions: string[];
}

export const ellipseApi = {
  me: () => api.get<CurrentUserDetails>("/api/Account/Me"),

  getPhase1Dashboard: () =>
    api.get<Phase1DashboardReport>("/api/Reports/Phase1Dashboard"),

  getAccessRequestReport: (params?: {
    fromUtc?: string;
    toUtc?: string;
    environment?: string;
    requestType?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.fromUtc) qs.set("fromUtc", params.fromUtc);
    if (params?.toUtc) qs.set("toUtc", params.toUtc);
    if (params?.environment) qs.set("environment", params.environment);
    if (params?.requestType) qs.set("requestType", params.requestType);
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return api.get<AccessRequestReportRow[]>(
      `/api/Reports/AccessRequests${q ? `?${q}` : ""}`,
    );
  },

  getAmendmentReport: (params?: {
    fromUtc?: string;
    toUtc?: string;
    environment?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.fromUtc) qs.set("fromUtc", params.fromUtc);
    if (params?.toUtc) qs.set("toUtc", params.toUtc);
    if (params?.environment) qs.set("environment", params.environment);
    const q = qs.toString();
    return api.get<AccessRequestReportRow[]>(
      `/api/Reports/AccessAmendments${q ? `?${q}` : ""}`,
    );
  },

  getEnvironmentAccessReport: (environment?: string, activeOnly?: boolean) => {
    const qs = new URLSearchParams();
    if (environment) qs.set("environment", environment);
    if (activeOnly != null) qs.set("activeOnly", String(activeOnly));
    const q = qs.toString();
    return api.get<AccessRequestReportRow[]>(
      `/api/Reports/EnvironmentAccess${q ? `?${q}` : ""}`,
    );
  },

  getContractorAccessReport: (params?: {
    activeOnly?: boolean;
    expiringWithinDays?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.activeOnly != null) qs.set("activeOnly", String(params.activeOnly));
    if (params?.expiringWithinDays != null) {
      qs.set("expiringWithinDays", String(params.expiringWithinDays));
    }
    const q = qs.toString();
    return api.get<ContractorAccessReportRow[]>(
      `/api/Reports/ContractorAccess${q ? `?${q}` : ""}`,
    );
  },

  getEnvironments: () =>
    api.get<EnvironmentDetails[]>("/api/Environments/GetAll"),

  createEnvironment: (body: { name: string; requiresTraining: boolean }) =>
    api.post<EnvironmentDetails>("/api/Environments/Create", body),

  updateEnvironment: (body: {
    id: number;
    name: string;
    requiresTraining: boolean;
  }) => api.put<EnvironmentDetails>("/api/Environments/Update", body),

  deleteEnvironment: (id: number) =>
    api.delete<boolean>(`/api/Environments/Delete?id=${id}`),

  getDepartments: () =>
    api.get<DepartmentDetails[]>("/api/Departments/GetAll"),

  createDepartment: (body: { code: string; name: string; isActive?: boolean }) =>
    api.post<DepartmentDetails>("/api/Lookups/CreateDepartment", body),

  updateDepartment: (body: {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
  }) => api.put<DepartmentDetails>("/api/Lookups/UpdateDepartment", body),

  createBranch: (body: {
    departmentId: number;
    name: string;
    isActive?: boolean;
  }) => api.post<BranchDetails>("/api/Lookups/CreateBranch", body),

  updateBranch: (body: {
    id: number;
    departmentId: number;
    name: string;
    isActive: boolean;
  }) => api.put<BranchDetails>("/api/Lookups/UpdateBranch", body),

  getRequestTypes: () =>
    api.get<RequestTypeDetails[]>("/api/Lookups/GetRequestTypes"),

  createRequestType: (body: { code: string; name: string }) =>
    api.post<RequestTypeDetails>("/api/Lookups/CreateRequestType", body),

  updateRequestType: (body: { id: number; code: string; name: string }) =>
    api.put<RequestTypeDetails>("/api/Lookups/UpdateRequestType", body),

  getEllipsePositions: () =>
    api.get<EllipsePositionDetails[]>("/api/Lookups/GetEllipsePositions"),

  createEllipsePosition: (body: {
    code: string;
    name: string;
    instance?: string | null;
    district?: string | null;
    isActive?: boolean;
  }) => api.post<EllipsePositionDetails>("/api/Lookups/CreateEllipsePosition", body),

  updateEllipsePosition: (body: {
    id: number;
    code: string;
    name: string;
    instance?: string | null;
    district?: string | null;
    isActive: boolean;
  }) => api.put<EllipsePositionDetails>("/api/Lookups/UpdateEllipsePosition", body),

  getRequests: () => api.get<RequestDetails[]>("/api/Requests/GetRequests"),

  getRequestById: (requestId: number) =>
    api.get<RequestDetails>(`/api/Requests/GetRequest?requestId=${requestId}`),

  createRequest: (body: NewRequestDetails) =>
    api.post<RequestDetails>("/api/Requests/CreateRequest", body),
  

  updateRequest: (body: RequestDetails) =>
    api.put<RequestDetails>("/api/Requests/UpdateRequest", body),

  cancelRequest: (requestId: number) =>
    api.post<boolean>(`/api/Requests/Cancel?requestId=${requestId}`),

  returnForAmendment: (
    requestId: number,
    body: { reason: string; amendmentType?: string; documentsRequested?: string },
  ) =>
    api.post<boolean>(
      `/api/Requests/ReturnForAmendment?requestId=${requestId}`,
      body,
    ),

  resubmitAmendment: (requestId: number) =>
    api.post<boolean>(`/api/Requests/ResubmitAmendment?requestId=${requestId}`),

  getRequestDocuments: (requestId: number) =>
    api.get<DocumentDetails[]>(
      `/api/Documents/GetRequestDocument?requestId=${requestId}`,
    ),

  downloadDocument: async (documentId: number) => {
    const { blob, fileName } = await apiDownloadBlob(
      `/api/Documents/DownloadDocument?id=${documentId}`,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  uploadDocument: async (
    requestId: number,
    documentType: string,
    file: File,
    documentCategory?: string,
  ) => {
    const form = new FormData();
    form.append("requestId", String(requestId));
    form.append("documentType", documentType);
    if (documentCategory) form.append("documentCategory", documentCategory);
    form.append("file", file, file.name);
    return api.post<DocumentDetails>("/api/Documents/Upload", form, { rawBody: true });
  },


  lineManagerApprove: (requestId: number) =>
    api.post<boolean>(`/api/Requests/LineManagerApprove?requestId=${requestId}`),

  lineManagerReject: (requestId: number, rejectionReason?: string) => {
    const qs = new URLSearchParams({ requestId: String(requestId) });
    if (rejectionReason) qs.set("rejectionReason", rejectionReason);
    return api.post<boolean>(`/api/Requests/LineManagerReject?${qs}`);
  },

  trainingVerify: (requestId: number, trainingDate: string, verifiedBy?: string) => {
    const qs = new URLSearchParams({
      requestId: String(requestId),
      trainingDate,
    });
    if (verifiedBy) qs.set("verifiedBy", verifiedBy);
    return api.post<boolean>(`/api/Requests/TrainingVerify?${qs}`);
  },

  ictApprove: (requestId: number) =>
    api.post<boolean>(`/api/Requests/IctApprove?requestId=${requestId}`),

  ictReject: (requestId: number, rejectionReason?: string) => {
    const qs = new URLSearchParams({ requestId: String(requestId) });
    if (rejectionReason) qs.set("rejectionReason", rejectionReason);
    return api.post<boolean>(`/api/Requests/IctReject?${qs}`);
  },

  trainingUnverify: (requestId: number, rejectionReason?: string) => {
    const qs = new URLSearchParams({ requestId: String(requestId) });
    if (rejectionReason) qs.set("rejectionReason", rejectionReason);
    return api.post<boolean>(`/api/Requests/TrainingUnverify?${qs}`);
  },

  hcImplement: (
    requestId: number,
    body: {
      ellipseUserId: number;
      dateAccessGranted: string;
      ellipseUserUpdateDate?: string | null;
      closureOutcome?: string | null;
      implementationComments?: string;
      mandatoryInformationVerified: boolean;
      contractorDocumentsVerified?: boolean;
    },
  ) =>
    api.post<boolean>(
      `/api/Requests/HcImplement?requestId=${requestId}`,
      body,
    ),

  hcReject: (requestId: number, rejectionReason?: string) => {
    const qs = new URLSearchParams({ requestId: String(requestId) });
    if (rejectionReason) qs.set("rejectionReason", rejectionReason);
    return api.post<boolean>(`/api/Requests/HcReject?${qs}`);
  },

  getWorkflowTasks: (candidateGroup?: string, requestId?: number) => {
    const qs = new URLSearchParams();
    if (candidateGroup) qs.set("candidateGroup", candidateGroup);
    if (requestId != null) qs.set("requestId", String(requestId));
    const q = qs.toString();
    return api.get<FlowableTaskDto[]>(
      `/api/WorkflowTasks/GetTasks${q ? `?${q}` : ""}`,
    );
  },

  getWorkflowHistory: (processInstanceId: string) =>
    api.get<FlowableHistoryEventDto[]>(
      `/api/WorkflowTasks/GetHistory?processInstanceId=${encodeURIComponent(processInstanceId)}`,
    ),

  getUsers: () => api.get<AppUserSummary[]>("/api/Roles/GetUsers"),

  getRoles: () => api.get<RoleDetails[]>("/api/Roles/GetRoles"),
};
