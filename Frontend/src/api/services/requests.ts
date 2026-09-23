import { http } from "../client";
import type {
  RequestDetails,
  NewRequestDetails,
  ImplementRequestDetails,
  ReturnForAmendmentDetails,
} from "../types";

export const requestsApi = {
  getAll: () => http.get<RequestDetails[]>("/Requests/GetRequests"),

  getEmployeeRequests: (email: string) =>
    http.get<RequestDetails[]>("/Requests/GetEmployeeRequestsByEmail", { params: { email } }),

  getManagerRequests: (email: string) =>
    http.get<RequestDetails[]>("/Requests/GetLineManagerRequestsByEmail", { params: { email } }),

  getICTManagerRequests: () =>
    http.get<RequestDetails[]>("/Requests/GetICTManagerRequests"),

  getHcSystemsOfficerRequests: () =>
    http.get<RequestDetails[]>("/Requests/GetHcSystemsOfficerRequests"),

  getTrainingVerificationRequests: () =>
    http.get<RequestDetails[]>("/Requests/GetTrainingCenterRequests"),

  getById: (requestId: number) =>
    http.get<RequestDetails>("/Requests/GetRequest", { params: { requestId } }),

  search: (searchString: string) =>
    http.get<RequestDetails[]>("/Requests/SearchRequest", { params: { searchString } }),

  create: (data: NewRequestDetails) =>
    http.post<RequestDetails>("/Requests/CreateRequest", { body: data }),

  update: (data: RequestDetails) =>
    http.put<RequestDetails>("/Requests/UpdateRequest", { body: data }),

  cancel: (requestId: number) =>
    http.post<boolean>("/Requests/Cancel", { params: { requestId } }),

  // Line Manager actions
  lineManagerApprove: (requestId: number) =>
    http.post<boolean>("/Requests/LineManagerApprove", { params: { requestId } }),

  lineManagerReject: (requestId: number, rejectionReason: string) =>
    http.post<boolean>("/Requests/LineManagerReject", {
      params: { requestId, rejectionReason },
    }),


  // Training Centre
  trainingVerify: (requestId: number, trainingDate: string, verifiedBy: string) =>
    http.post<boolean>("/Requests/TrainingVerify", {
      params: { requestId, trainingDate, verifiedBy },
    }),

  trainingUnverify: (requestId: number, rejectionReason: string) =>
    http.post<boolean>("/Requests/TrainingUnverify", {
      params: { requestId, rejectionReason },
    }),

  // ICT Manager
  ictApprove: (requestId: number) =>
    http.post<boolean>("/Requests/IctApprove", { params: { requestId } }),

  ictReject: (requestId: number, rejectionReason: string) =>
    http.post<boolean>("/Requests/IctReject", {
      params: { requestId, rejectionReason },
    }),

  // HC Systems Admin
  hcImplement: (requestId: number, data: ImplementRequestDetails) =>
    http.post<boolean>("/Requests/HcImplement", {
      params: { requestId },
      body: data,
    }),

  hcReject: (requestId: number, rejectionReason: string) =>
    http.post<boolean>("/Requests/HcReject", {
      params: { requestId, rejectionReason },
    }),

  // Amendments
  returnForAmendment: (requestId: number, data: ReturnForAmendmentDetails) =>
    http.post<boolean>("/Requests/ReturnForAmendment", {
      params: { requestId },
      body: data,
    }),

  resubmitAmendment: (requestId: number) =>
    http.post<boolean>("/Requests/ResubmitAmendment", { params: { requestId } }),
};
