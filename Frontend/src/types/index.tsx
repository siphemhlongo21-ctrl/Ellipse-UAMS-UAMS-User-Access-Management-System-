import { type DocumentAccessLogEntry } from "./DocumentAccessLogEntry";

// ─── Types ────────────────────────────────────────────────────────────────────

export type View =
  | "login" | "dashboard" | "requests" | "contractors"
  | "reports" | "new-request" | "history" | "permissions";

export type Env = "Production" | "Test" | "Development" | "ALL";

export type ApplicantKind = "Employee" | "Contractor";

export type EnvironmentCode = "PROD" | "TEST" | "DEV";

export const INITIAL_DOC_ACCESS_LOG: DocumentAccessLogEntry[] = [];

export type UserRole =
  | "Requestor"
  | "Line Manager"
  | "Deputy Head"
  | "ICT Manager"
  | "Training Centre"
  | "HC Systems Administrator";



export type RequestStatus =
  | "Draft"
  | "Submitted"
  | "LineManagerApproved"
  | "TrainingVerified"
  | "IctApproved"
  | "Implemented"
  | "Rejected"
  | "ReturnedForAmendment"
  | "Cancelled";

  // ─── Static Options ──────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  "Auxiliary Services",
  "Customer Services",
  "HV Operations",
  "MV LV Operations",
  "Technical Support",
];

export const BRANCHES: Record<string, string[]> = {
  "Auxiliary Services": [
    "Auxiliary Services","Administration","ICT","SCM","Productivity","Infrastructure Theft",
  ],
  "Customer Services": [
    "Customer Services","Meter Engineering","Revenue Protection","Pricing and Marketing",
  ],
  "HV Operations": [
    "HV Operations","HV Cables","HV Lines","HV Network Control",
    "HV Planning","HV Projects","HV Substations",
  ],
  "MV LV Operations": [
    "MV LV Operations","Network Control","Construction Planning and Works",
    "Lighting Planning","Lighting Works","Maintenance Planning and Works",
  ],
  "Technical Support": [
    "Technical Support","Technology Services","Infrastructure Asset Management",
    "Communication Networks","Protection & Test","Network Drawing Office and Survey",
    "SHERQ & Training","Mechanical Workshop","Electrical Workshop",
  ],
};