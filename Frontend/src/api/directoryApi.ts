import { apiRequest } from "./http";
import type { ContractorDetails, EmployeeDetails, RequestApproverActionDetails } from "./types";


export function getApprovalsForRequest(requestId: number, signal?: AbortSignal) {
  return apiRequest<RequestApproverActionDetails[]>(
    "/api/RequestApproval/GetApprovalsForRequest",
    { query: { requestId }, signal },
  );
}

export function createApprovals(body: RequestApproverActionDetails) {
  return apiRequest<unknown>("/api/RequestApproval/CreateApprovals", {
    method: "POST",
    body,
  });
}
