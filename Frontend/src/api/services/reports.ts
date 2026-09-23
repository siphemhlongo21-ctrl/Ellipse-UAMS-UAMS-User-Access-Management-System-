import { http } from "../client";
import type {
  Phase1DashboardReport,
  AccessRequestReportRow,
  ContractorAccessReportRow,
} from "../types";

export const reportsApi = {
  dashboard: () =>
    http.get<Phase1DashboardReport>("/Reports/Phase1Dashboard"),

  accessRequests: (params: {
    fromUtc?: string;
    toUtc?: string;
    environment?: string;
    requestType?: string;
    status?: string;
  }) => http.get<AccessRequestReportRow[]>("/Reports/AccessRequests", { params }),

  accessAmendments: (params: { fromUtc?: string; toUtc?: string }) =>
    http.get<AccessRequestReportRow[]>("/Reports/AccessAmendments", { params }),

  environmentAccess: (params: { environment?: string; activeOnly?: boolean }) =>
    http.get<AccessRequestReportRow[]>("/Reports/EnvironmentAccess", { params }),

  contractorAccess: (params: {
    companyName?: string;
    contractEndFrom?: string;
    contractEndTo?: string;
    accessState?: string;
  }) => http.get<ContractorAccessReportRow[]>("/Reports/ContractorAccess", { params }),
};
