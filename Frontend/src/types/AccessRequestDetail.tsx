import { type SupportingDocument } from "./SupportingDocument";
import { type AccessRequestSummary } from "./AccessRequestSummary";
import { type DocumentAccessLogEntry } from "./DocumentAccessLogEntry";
import { type ClosureRecord } from "./ClosureRecord";
import { type TrainingVerificationRecord } from "./TrainingVerificationRecord";
import { type WorkflowStage } from "./WorkflowStage";

export interface AccessRequestDetail extends AccessRequestSummary {
  description: string;
  documents: SupportingDocument[];
  accessLog: DocumentAccessLogEntry[];
  workflow: WorkflowStage[];
  companyName?: string;
  startDate?: string;
  endDate?: string;
  trainingVerification?: TrainingVerificationRecord;
  closure?: ClosureRecord;
  outcomeComments?: string;
}