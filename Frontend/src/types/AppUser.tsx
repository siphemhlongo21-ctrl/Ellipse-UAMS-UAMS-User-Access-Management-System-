import { type UserRole } from "./index";

export interface AppUser {
  id: string;
  displayName: string;
  /** Primary UI role label (derived from API role codes). */
  role: UserRole;
  /** Human-readable primary role from API. */
  roleLabel: string;
  /** Raw role codes from Ellipse.API (e.g. LINE_MANAGER). */
  roles: string[];
  permissions: string[];
  initials: string;
  /** AD username sent as X-AD-Username in Development */
  adUsername: string;
  email?: string;
  employeeEmail?: string;
}