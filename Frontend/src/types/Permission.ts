export interface PermissionDetails {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export type UserRole = 
  | "line-manager" 
  | "training-centre" 
  | "ict-manager" 
  | "hc-systems-officer" 
  | "system-admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  "line-manager": "Line Manager",
  "training-centre": "Training Centre",
  "ict-manager": "ICT Manager",
  "hc-systems-officer": "HC Systems Officer",
  "system-admin": "System Administrator",
};