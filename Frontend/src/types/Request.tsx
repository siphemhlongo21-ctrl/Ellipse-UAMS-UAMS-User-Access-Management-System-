import { type ReqType } from "./ReqType";
import { type ReqStatus } from "./ReqStatus";
import type { Approver } from "./Approver";
import {type EnvironmentCode} from "./index";

export interface Request {
  id: number; type: ReqType; employee: string; serviceNumber: string;
  department: string; branch: string; env: EnvironmentCode; status: ReqStatus;
  submitted: string; approvers: Approver[];
  numericId?: number;
  isContractor?: boolean; docsUploaded?: boolean; expiryDate?: string;
  designation?: string; email?: string; phone?: string;
  adUsername?: string; postId?: string;
  accessLevel?: string; ellipsePosition?: string; menuAccess?: string;
  businessJustification?: string; startDate?: string;
  contractorCompany?: string; contractorId?: string;
  rejectionReason?: string;
}