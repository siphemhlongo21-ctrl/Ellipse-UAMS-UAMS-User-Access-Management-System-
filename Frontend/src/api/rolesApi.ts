import { apiRequest } from "./http";
import type {
  AppUserSummary,
  AssignRoleRequest,
  CreateRoleRequest,
  RoleDetails,
  UserRoleDetails,
} from "./types";

export function getRoles(signal?: AbortSignal) {
  return apiRequest<RoleDetails[]>("/api/Roles/GetRoles", { signal });
}

export function createRole(body: CreateRoleRequest) {
  return apiRequest<RoleDetails>("/api/Roles/CreateRole", {
    method: "POST",
    body,
  });
}

export function updateRole(
  roleId: number,
  body: {
    name: string;
    description?: string | null;
    isActive?: boolean;
  },
) {
  return apiRequest<RoleDetails>("/api/Roles/UpdateRole", {
    method: "PUT",
    query: { roleId },
    body,
  });
}

export function deleteRole(id: number) {
  return apiRequest(`/api/Roles/DeleteRole/${id}`, {
    method: "DELETE",
  });
}

export function getUsers(signal?: AbortSignal) {
  return apiRequest<AppUserSummary[]>("/api/Roles/GetUsers", { signal });
}

export function getUser(query: {
  appUserId?: number;
  activeDirectoryUsername?: string;
  signal?: AbortSignal;
}) {
  return apiRequest<AppUserSummary>("/api/Roles/GetUser", {
    query: {
      appUserId: query.appUserId,
      activeDirectoryUsername: query.activeDirectoryUsername,
    },
    signal: query.signal,
  });
}

export function getUserRoles(query: {
  appUserId?: number;
  activeDirectoryUsername?: string;
  signal?: AbortSignal;
}) {
  return apiRequest<UserRoleDetails[]>("/api/Roles/GetUserRoles", {
    query: {
      appUserId: query.appUserId,
      activeDirectoryUsername: query.activeDirectoryUsername,
    },
    signal: query.signal,
  });
}

export function assignRole(body: AssignRoleRequest) {
  return apiRequest("/api/Roles/AssignRole", {
    method: "POST",
    body,
  });
}

export function revokeRole(query: {
  serviceNumber?: string;
  activeDirectoryUsername?: string;
  roleCode: string;
}) {
  return apiRequest("/api/Roles/RevokeRole", {
    method: "DELETE",
    query,
  });
}

export function setUserActive(query: {
  appUserId?: number;
  activeDirectoryUsername?: string;
  isActive: boolean;
}) {
  return apiRequest("/api/Roles/SetUserActive", {
    method: "PUT",
    query,
  });
}

