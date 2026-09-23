import { type UserRole } from "./UserRole";

type AuditEventCategory =
  | "Auth"
  | "Request"
  | "Approval"
  | "Document"
  | "Admin"
  | "System";

export interface AuditEvent {
  id: string;
  at: string;
  category: AuditEventCategory;
  action: string;
  actorName: string;
  actorRole: UserRole | string;
  target: string;
  details: string;
  ipAddress: string;
}