import { apiRequest } from "./http";

export interface RolePermissionDetails {
  roleId: number;
  permissionId: number;
  roleName: string;
  permissionName: string;
}

export interface AddRolePermissionDetails {
  roleId: number;
  permissionId: number;
}

export async function getRolePermissions(
  filterString?: string
): Promise<Record<string, RolePermissionDetails[]>> {
  return apiRequest<Record<string, RolePermissionDetails[]>>(
    "/api/RolePermission/GetRolePermissions",
    {
      query: filterString
        ? { filterString }
        : undefined,
    }
  );
}

export async function getRolePermission(
  roleId: number,
  permissionId: number
): Promise<RolePermissionDetails> {
  return apiRequest<RolePermissionDetails>(
    "/api/RolePermission/GetRolePermission",
    {
      query: {
        roleId,
        permissionId,
      },
    }
  );
}

export async function addRolePermission(
  data: AddRolePermissionDetails
): Promise<RolePermissionDetails> {
  return apiRequest<RolePermissionDetails>(
    "/api/RolePermission/AddRolePermission",
    {
      method: "POST",
      body: data,
    }
  );
}

export async function deleteRolePermission(
  roleId: number,
  permissionId: number
): Promise<void> {
  return apiRequest<void>(
    "/api/RolePermission/DeleteRolePermission",
    {
      method: "DELETE",
      query: {
        roleId,
        permissionId,
      },
    }
  );
}