import { apiRequest } from "./http";

export interface Permission {
  permissionId: number;
  permissionName: string;
}

export interface PermissionDetails {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}
export type AddPermissionDetails = Omit<PermissionDetails, "id">;

export async function getPermissions(filterString?: string): Promise<PermissionDetails[]> {
  return apiRequest<PermissionDetails[]>(
    "/api/Permission/GetPermissions",
    {
      query:filterString
        ? { filterString }
        : undefined,
    }
  );
}

export async function getPermission(
  id: number
): Promise<PermissionDetails> {
  return apiRequest<PermissionDetails>(
    "/api/Permission/GetPermission",
    {
      query: { id },
    }
  );
}

export async function addPermission(
  data: AddPermissionDetails
): Promise<PermissionDetails> {
  return apiRequest<PermissionDetails>(
    "/api/Permission/CreatePermission",
    {
      method: "POST",
      body: data,
    }
  );
}

export async function updatePermission(
  id: number,
  data: PermissionDetails
): Promise<PermissionDetails> {
  return apiRequest<PermissionDetails>(
    `/api/Permission/UpdatePermission/${id}`,
    {
      method: "PUT",
      body: data,
      query: { id },
    }
  );
}

export async function deletePermission(
  id: number
): Promise<void> {
  return apiRequest<void>(
    `/api/Permission/DeletePermission/${id}`,
    {
      method: "DELETE",
      query: { id },
    }
  );
}