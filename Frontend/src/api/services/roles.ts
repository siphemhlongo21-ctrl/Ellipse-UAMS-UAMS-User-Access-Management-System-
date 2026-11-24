import { http } from "../client";
import type {
  RoleDetails,
  AppUserSummary,
  UserRoleDetails,
  AssignRoleRequest,
} from "../types";

export const rolesApi = {
  getRoles: () => http.get<RoleDetails[]>("/Roles/GetRoles"),

  getUsers: () => http.get<AppUserSummary[]>("/Roles/GetUsers"),

  getUser: (appUserId: number) =>
    http.get<AppUserSummary>("/Roles/GetUser", { params: { appUserId } }),

  getUserRoles: (appUserId: number) =>
    http.get<UserRoleDetails[]>("/Roles/GetUserRoles", { params: { appUserId } }),

  assignRole: (data: AssignRoleRequest) =>
    http.post<UserRoleDetails>("/Roles/AssignRole", { body: data }),

  revokeRole: (appUserId: number, roleCode: string) =>
    http.patch<void>("/Roles/RevokeRole", { params: { appUserId, roleCode } }),

  setUserActive: (appUserId: number, isActive: boolean) =>
    http.put<void>("/Roles/SetUserActive", { params: { appUserId, isActive } }),
};
