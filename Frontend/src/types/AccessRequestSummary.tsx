import type { EnvironmentCode, ApplicantKind } from ".";


export interface AccessRequestSummary {
    id: string;
    requestNumber: string;
    type: string;
    employeeName: string;
    employeeId: string;
    department: string;
    environment: EnvironmentCode;
    submittedOn: string;
    statusLabel: string;
    statusTone: "pending" | "approved" | "rejected" | "neutral";
    applicantKind: ApplicantKind;
    companyName?: string;
    serviceNumber?: string;
}