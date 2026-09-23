import { apiRequest } from "./http";
import type {
  ImplementRequestDetails,
  NewRequestDetails,
  RequestDetails,
  ReturnForAmendmentDetails,
} from "./types";

export function getRequests(signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/GetRequests", { signal });
}

export function getRequest(requestId?: number, signal?: AbortSignal) {
  return apiRequest<RequestDetails>("/api/Requests/GetRequest", {
    query: { requestId },
    signal,
  });
}

export function getEmployeeRequests(email: string, signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/GetEmployeeRequestsByEmail", {
    query: { email },
    signal,
  });
}

export function GetLineManagerRequestsByEmail(email: string, signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/GetLineManagerRequestsByEmail", {
    query: { email },
    signal,
  });
}

export function getICTManagerRequests(signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/getICTManagerRequests", { signal });
}

export function getHcSystemsOfficerRequests(signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/GetHcSystemsOfficerRequests", { signal });
}

export function getTrainingVerificationRequests(signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/GetTrainingCenterRequests", { signal });
}

export function searchRequests(searchString: string, signal?: AbortSignal) {
  return apiRequest<RequestDetails[]>("/api/Requests/SearchRequest", {
    query: { searchString },
    signal,
  });
}

export function createRequest(body: NewRequestDetails) {
  return apiRequest<RequestDetails>("/api/Requests/CreateRequest", {
    method: "POST",
    body,
  });
}

export function updateRequest(body: RequestDetails) {
  return apiRequest<unknown>("/api/Requests/UpdateRequest", {
    method: "PUT",
    body,
  });
}

export function cancelRequest(requestId: number) {
  return apiRequest<boolean>("/api/Requests/Cancel", {
    method: "POST",
    query: { requestId },
  });
}

export function lineManagerApprove(requestId: number) {
  return apiRequest<boolean>("/api/Requests/LineManagerApprove", {
    method: "POST",
    query: { requestId },
  });
}

export function lineManagerReject(requestId: number, rejectionReason: string) {
  return apiRequest<boolean>("/api/Requests/LineManagerReject", {
    method: "POST",
    query: { requestId, rejectionReason },
  });
}

export function ictApprove(requestId: number) {
  return apiRequest<boolean>("/api/Requests/IctApprove", {
    method: "POST",
    query: { requestId },
  });
}

export function ictReject(requestId: number, rejectionReason: string) {
  return apiRequest<boolean>("/api/Requests/IctReject", {
    method: "POST",
    query: { requestId, rejectionReason },
  });
}

export function trainingVerify(
  requestId: number,
  trainingDate: string,
  verifiedBy: string,
) {
  return apiRequest<boolean>("/api/Requests/TrainingVerify", {
    method: "POST",
    query: { requestId, trainingDate, verifiedBy },
  });
}

export function trainingUnverify(requestId: number) {
  return apiRequest<boolean>("/api/Requests/TrainingUnverify", {
    method: "POST",
    query: { requestId },
  });
}

export function hcImplement(requestId: number, body: ImplementRequestDetails) {
  return apiRequest<boolean>("/api/Requests/HcImplement", {
    method: "POST",
    query: { requestId },
    body,
  });
}

export function hcReject(requestId: number, rejectionReason: string) {
  return apiRequest<boolean>("/api/Requests/HcReject", {
    method: "POST",
    query: { requestId, rejectionReason },
  });
}

export function returnForAmendment(requestId: number, body: ReturnForAmendmentDetails) {
  return apiRequest<boolean>("/api/Requests/ReturnForAmendment", {
    method: "POST",
    query: { requestId },
    body,
  });
}

export function resubmitAmendment(requestId: number) {
  return apiRequest<boolean>("/api/Requests/ResubmitAmendment", {
    method: "POST",
    query: { requestId },
  });
}
