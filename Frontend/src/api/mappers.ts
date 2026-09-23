import type { EnvironmentCode, UserRole } from "../types";
import { type AccessRequestDetail } from "../types/AccessRequestDetail";
import { type AccessRequestSummary } from "../types/AccessRequestSummary";
import { type WorkflowStage } from "../types/WorkflowStage";
import type { RequestDetails } from "./ellipseApi";
import type {
  RequestApproverActionDetails,
  RequestDetails as LegacyRequestDetails,
} from "./types";

const CLOSED = new Set(["Implemented", "Rejected", "Cancelled"]);
const APPROVED = new Set(["Implemented"]);
const REJECTED = new Set(["Rejected", "Cancelled"]);

const STATUS_LABELS: Record<string, string> = {
  Draft: "Draft (not submitted)",
  PendingApproval: "Pending Approval (LM)",
  TrainingVerificationPending: "Training Verification",
  ICTManagerApprovalPending: "ICT Manager Approval",
  HcActionPending: "HC Action Pending",
  ReturnForAmendment: "Return for Amendment",
  Implemented: "Implemented",
  Rejected: "Rejected",
  Cancelled: "Cancelled",
};

export function formatStatusLabel(status: string): string {
  if (!status) return "Unknown";
  return STATUS_LABELS[status] ?? status.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function mapEnvironmentCode(name?: string | null): EnvironmentCode {
  const n = (name ?? "").toLowerCase();
  if (n.startsWith("prod")) return "PROD";
  if (n.startsWith("test")) return "TEST";
  return "DEV";
}

export function statusTone(
  status: string,
): "pending" | "approved" | "rejected" | "neutral" {
  if (status === "Draft") return "neutral";
  if (APPROVED.has(status)) return "approved";
  if (REJECTED.has(status)) return "rejected";
  if (CLOSED.has(status)) return "neutral";
  return "pending";
}

export function parseApiDate(value: string | null | undefined): Date {
  if (!value) return new Date(NaN);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  return new Date(hasZone ? value : `${value.trim()}Z`);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = parseApiDate(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = parseApiDate(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toRequestSummary(r: RequestDetails) {
  const status = String(r.status ?? "");
  const employeeName =
    r.employeeName?.trim() ||
    r.contractorName?.trim() ||
    r.companyName?.trim() ||
    r.employeeEmail ||
    r.userType ||
    "—";
  return {
    id: String(r.id),
    requestNumber: r.requestNumber ?? `REQ-${r.id}`,
    type: r.requestType ?? "—",
    employeeName,
    employeeId: r.serviceNumber?.trim() || r.employeeEmail || "",
    department: r.department?.trim() || "—",
    environment: mapEnvironmentCode(r.environment),
    // Draft was never sent — do not show a "Submitted" date.
    submittedOn: status === "Draft" ? "Not submitted" : formatDate(r.requestedDate),
    statusLabel: formatStatusLabel(status),
    statusTone: statusTone(status),
    applicantKind:
      (r.userType ?? "").toLowerCase() === "contractor"
        ? ("Contractor" as const)
        : ("Employee" as const),
    companyName: r.companyName ?? "",
    serviceNumber: r.serviceNumber ?? "",
  };
}

export function primaryRoleLabel(roles: string[]): string {
  const priority = [
    "SYSTEM_ADMIN",
    "HC_SYSTEMS_OFFICER",
    "ICT_MANAGER",
    "TRAINING_CENTRE",
    "LINE_MANAGER",
    "EMPLOYEE",
  ];
  const labels: Record<string, string> = {
    SYSTEM_ADMIN: "System Admin",
    HC_SYSTEMS_OFFICER: "HC Systems Officer",
    ICT_MANAGER: "ICT Manager",
    TRAINING_CENTRE: "Training Centre",
    LINE_MANAGER: "Line Manager",
    EMPLOYEE: "Employee",
  };
  for (const code of priority) {
    if (roles.includes(code)) return labels[code] ?? code;
  }
  return roles[0] ?? "User";
}

/** Maps API role codes to legacy UI UserRole labels used by navigation. */
export function roleCodeToUserRole(roles: string[]): string {
  if (roles.includes("HC_SYSTEMS_OFFICER")) return "HC Systems Administrator";
  if (roles.includes("ICT_MANAGER")) return "ICT Manager";
  if (roles.includes("TRAINING_CENTRE")) return "Training Centre";
  if (roles.includes("LINE_MANAGER")) return "Line Manager";
  if (roles.includes("SYSTEM_ADMIN")) return "HC Systems Administrator";
  return "Requestor";
}

export function isOpenStatus(status: string): boolean {
  // Draft is not in the workflow yet — not "open" for approver progression.
  return !["Draft", "Implemented", "Rejected", "Cancelled"].includes(status);
}

/** Statuses that appear in an approver's actionable My Tasks queue. */
export function isActionableQueueStatus(
  status: string,
  hasPermission: (code: string) => boolean,
): boolean {
  switch (status) {
    case "PendingApproval":
      return hasPermission("request.approve.line_manager");
    case "TrainingVerificationPending":
      return hasPermission("request.verify.training");
    case "ICTManagerApprovalPending":
      return hasPermission("request.approve.ict");
    case "HcActionPending":
      return (
        hasPermission("request.implement") ||
        hasPermission("request.return_for_amendment")
      );
    default:
      return false;
  }
}

export function workflowStagesFromRequest(r: RequestDetails): WorkflowStage[] {
  const env = mapEnvironmentCode(r.environment);
  const status = String(r.status ?? "");
  const isAmendment = status === "ReturnForAmendment";
  const stages =
    env === "PROD"
      ? [
        { id: "lm", role: "Line Manager", flag: r.lineManagerApproved },
        { id: "tr", role: "Training Centre", flag: r.trainingVerified },
        { id: "hc", role: "HC Systems Officer", flag: r.hcSystemsAdminApproved },
      ]
      : [
        { id: "lm", role: "Line Manager", flag: r.businessNeedConfirmed ?? r.lineManagerApproved },
        { id: "ict", role: "ICT Manager", flag: r.ictManagerApproved },
        { id: "hc", role: "HC Systems Officer", flag: r.hcSystemsAdminApproved },
      ];

  // Not submitted — no stage is awaiting approver action yet.
  if (status === "Draft") {
    return stages.map(
      (stage): WorkflowStage => ({
        id: stage.id,
        role: stage.role,
        actorName: "—",
        status: "awaiting",
      }),
    );
  }

  let foundPending = false;
  return stages.map((stage): WorkflowStage => {
    if (stage.flag === true) {
      return {
        id: stage.id,
        role: stage.role,
        actorName: stage.role,
        status: "completed",
        decisionLabel: "Approved",
      };
    }
    if (stage.flag === false) {
      return {
        id: stage.id,
        role: stage.role,
        actorName: stage.role,
        status: "completed",
        decisionLabel: "Rejected",
        note: r.rejectionReason ?? undefined,
      };
    }

    // Amendment parks the request with the requestor — HC is waiting for resubmit, not actioning.
    if (isAmendment && stage.id === "hc") {
      foundPending = true;
      return {
        id: stage.id,
        role: stage.role,
        actorName: "Awaiting resubmit",
        status: "pending",
        decisionLabel: "Returned for amendment",
        note: r.amendmentReason ?? undefined,
      };
    }

    if (!foundPending && isOpenStatus(status) && !isAmendment) {
      foundPending = true;
      return {
        id: stage.id,
        role: stage.role,
        actorName: "Awaiting action",
        status: "pending",
      };
    }

    if (!foundPending && isAmendment && stage.id !== "hc") {
      // Prior stages without flags should not become "pending" while amending.
      return {
        id: stage.id,
        role: stage.role,
        actorName: "—",
        status: "awaiting",
      };
    }

    return {
      id: stage.id,
      role: stage.role,
      actorName: "—",
      status: "awaiting",
    };
  });
}

export function initialsFromName(name?: string | null, fallback = "U"): string {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}


/** Alias used by requestService / mock bridge. */
export function mapRequestToSummary(item: LegacyRequestDetails): AccessRequestSummary {
  return toRequestSummary(item as RequestDetails);
}

function toDateOnly(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function buildWorkflowFromFlags(item: LegacyRequestDetails): WorkflowStage[] {
  return workflowStagesFromRequest(item as RequestDetails);
}

export function mapApprovalsToWorkflow(
  approvals: RequestApproverActionDetails[],
): WorkflowStage[] {
  return approvals.map((item) => ({
    id: String(item.id),
    role: item.approverType ?? "Approver",
    actorName: [item.name, item.surname].filter(Boolean).join(" ") || "Approver",
    status: "completed" as const,
    decisionLabel: item.actionType ?? "Actioned",
    actionAt: item.approverDate?.replace("T", " ").slice(0, 16),
  }));
}

export function mapRequestToDetail(
  item: LegacyRequestDetails,
  approvals?: RequestApproverActionDetails[],
): AccessRequestDetail {
  const summary = mapRequestToSummary(item);
  const workflow =
    approvals && approvals.length > 0
      ? [
        ...mapApprovalsToWorkflow(approvals),
        ...buildWorkflowFromFlags(item).filter((stage) => stage.status !== "completed"),
      ]
      : buildWorkflowFromFlags(item);

  return {
    ...summary,
    description: item.businessJustification ?? "Ellipse access request.",
    documents: [],
    accessLog: [],
    workflow,
    startDate: toDateOnly(item.startDate) || undefined,
    endDate: toDateOnly(item.endDate) || undefined,
    outcomeComments: item.rejectionReason ?? item.implementationComments ?? undefined,
    closure: item.ellipseUserUpdateDate
      ? {
        ellipseUpdateDate: toDateOnly(item.ellipseUserUpdateDate),
        mandatoryInfoVerified: true,
        comments: item.implementationComments ?? "",
        closedAt: toDateOnly(item.dateAccessGranted) || toDateOnly(item.ellipseUserUpdateDate),
      }
      : undefined,
    trainingVerification: item.trainingVerified
      ? {
        trainingCompleted: true,
        completionDate: toDateOnly(item.requestedDate),
        verifiedByName: "Training Centre",
        verifiedByServiceNumber: "—",
      }
      : undefined,
  };
}

export function mapUiRoleToApiAction(role: UserRole): "line" | "ict" | "training" | "hc" | "none" {
  if (role === "Line Manager" || role === "Deputy Head") return "line";
  if (role === "ICT Manager") return "ict";
  if (role === "Training Centre") return "training";
  if (role === "HC Systems Administrator") return "hc";
  return "none";
}