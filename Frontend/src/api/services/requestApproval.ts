import { http } from "../client";
import type { RequestApproverActionDetails } from "../types";

export const requestApprovalApi = {
  getForRequest: (requestId: number) =>
    http.get<RequestApproverActionDetails[]>("/RequestApproval/GetApprovalsForRequest", {
      params: { requestId },
    }),
};
