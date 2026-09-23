import { type UserRole } from "./UserRole";

export type PermissionLevel = "none" | "view" | "act" | "admin";

export interface RolePermissionRow {
  id: string;
  capability: string;
  description: string;
  levels: Record<UserRole, PermissionLevel>;
}