import { type UserRole } from "./UserRole";

type WorkflowStageStatus = "completed" | "pending" | "awaiting";

export interface WorkflowStage {
  id: string;
  role: UserRole | string;
  actorName: string;
  status: WorkflowStageStatus;
  decisionLabel?: string;
  actionAt?: string;
  note?: string;
}