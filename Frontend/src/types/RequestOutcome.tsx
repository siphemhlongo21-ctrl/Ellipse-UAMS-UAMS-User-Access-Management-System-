import { type EnvironmentCode } from ".";

export interface RequestOutcome {
  id: string;
  requestNumber: string;
  employeeName: string;
  outcome: "Approved" | "Rejected";
  comments: string;
  closedAt: string;
  environment: EnvironmentCode;
}