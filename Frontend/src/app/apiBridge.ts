/**
 * Bridges the live App.tsx UI models to Ellipse.API services.
 */
import {
  documentsApi,
  requestsApi,
  ApiError,
  setAuthToken,
  type NewRequestDetails,
  type RequestDetails,
  type ImplementRequestDetails,
  type ReturnForAmendmentDetails,
} from "../api";
import { type UserRole } from "../types";

export type AppEnv = "PROD" | "TEST" | "DEV" | "ALL";

export type AppReqStatus =
  | "draft"
  | "pending"
  | "pending-tc-verification"
  | "pending-ict-approval"
  | "pending-hc-implementation"
  | "pending-hc-review"
  | "awaiting-information"
  | "access-implemented"
  | "approved"
  | "rejected"
  | "rejected-by-lm"
  | "rejected-by-tc"
  | "rejected-by-ict"
  | "rejected-by-hc"
  | "implemented"
  | "expired"
  | "Awaiting Resubmission";

export interface AppSession {
  name: string;
  role: UserRole;
  email: string;
  roles?: UserRole[];
  adUsername?: string;
  permissions?: string[];
  appUserId?: number | null;
}

export interface AppApprover {
  name: string;
  role: string;
  status: "pending" | "approved" | "rejected" | "waiting" | "training-verified" | "implemented" | "closed";
  actionLabel?: string;
  date?: string;
  time?: string;
  comments?: string;
}

export interface AppRequest {
  id: string;
  numericId: number;
  type: string;
  employee: string;
  serviceNumber: string;
  department: string;
  branch: string;
  env: AppEnv;
  status: AppReqStatus;
  submitted: string;
  approvers: AppApprover[];
  isContractor?: boolean;
  docsUploaded?: boolean;
  expiryDate?: string;
  designation?: string;
  email?: string;
  phone?: string;
  adUsername?: string;
  postId?: string;
  accessLevel?: string;
  ellipsePosition?: string;
  menuAccess?: string;
  businessJustification?: string;
  startDate?: string;
  contractorCompany?: string;
  contractorId?: string;
  responsibleManager?: string;
  contactNumber?: string;
  rejectionReason?: string;
}

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body;
    if (typeof body === "string" && body.trim()) return body.trim();
    if (body && typeof body === "object") {
      const obj = body as { message?: string; title?: string; detail?: string };
      if (obj.message) return obj.message;
      if (obj.title) return obj.title;
      if (obj.detail) return obj.detail;
    }
    return err.message || `API error ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return "Unexpected API error";
}

function normalizeRoleToken(role: string): string {
  return role.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function mapRoleCodesToAppRoles(roles: string[]): string[] {
  const mapped: string[] = [];
  const add = (role: string) => {
    if (!mapped.includes(role)) mapped.push(role);
  };

  const tokens = new Set((roles ?? []).map(normalizeRoleToken).filter(Boolean));
  const has = (...codes: string[]) => codes.some((code) => tokens.has(normalizeRoleToken(code)));

  // Highest-privilege first so roles[0] is the acting UI role.
  if (has("HC_SYSTEMS_OFFICER")) add("HC_SYSTEMS_OFFICER");
  if (has("SYSTEM_ADMIN")) add("SYSTEM_ADMIN");
  if (has("ICT_MANAGER")) add("ICT_MANAGER");
  if (has("TRAINING_CENTRE")) add("TRAINING_CENTRE");
  if (has("LINE_MANAGER")) add("LINE_MANAGER");
  if (has("EMPLOYEE")) add("EMPLOYEE");

  if (mapped.length === 0) add("EMPLOYEE");
  return mapped;
}

export function mapRoleCodesToAppRole(roles: string[]): string {
  const mapped = mapRoleCodesToAppRoles(roles);
  if (mapped.includes("HC_SYSTEMS_OFFICER") || mapped.includes("SYSTEM_ADMIN")) {
    return "HC_SYSTEMS_OFFICER";
  }
  if (mapped.includes("ICT_MANAGER")) return "ICT_MANAGER";
  if (mapped.includes("TRAINING_CENTRE")) return "TRAINING_CENTRE";
  if (mapped.includes("LINE_MANAGER")) return "LINE_MANAGER";
  return "EMPLOYEE";
}

export function mapEnvironmentToApi(env: string): string {
  const code = env.toUpperCase();
  if (code === "PROD" || code === "PRODUCTION") return "Production";
  if (code === "TEST" || code === "TESTING") return "Test";
  if (code === "DEV" || code === "DEVELOPMENT") return "Development";
  if (code === "ALL") return "Production";
  return env;
}

export function mapEnvironmentFromApi(name?: string | null): AppEnv {
  const n = (name ?? "").toLowerCase();
  if (n.startsWith("prod")) return "PROD";
  if (n.startsWith("test")) return "TEST";
  if (n === "all") return "ALL";
  return "DEV";
}

export function mapApiStatusToApp(status?: string | null): AppReqStatus {
  switch (status) {
    case "Draft":
      return "draft";
    case "PendingApproval":
      return "pending";
    case "TrainingVerificationPending":
      return "pending-tc-verification";
    case "ICTManagerApprovalPending":
      return "pending-ict-approval";
    case "HcActionPending":
      return "pending-hc-implementation";
    case "ReturnForAmendment":
      return "awaiting-information";
    case "Implemented":
      return "access-implemented";
    case "Rejected":
      return "rejected";
    case "Cancelled":
      return "rejected";
    default:
      return "pending";
  }
}

function buildApprovers(r: RequestDetails): AppApprover[] {
  const env = mapEnvironmentFromApi(r.environment);
  const status = String(r.status ?? "");
  const isClosed = status === "Rejected" || status === "Cancelled";
  const stages =
    env === "PROD" || env === "ALL"
      ? [
        { role: "Line Manager", flag: r.lineManagerApproved },
        { role: "Training Centre Representative", flag: r.trainingVerified },
        { role: "HC Systems Officer", flag: r.hCSystemsAdminApproved },
      ]
      : [
        { role: "Line Manager", flag: r.lineManagerApproved },
        { role: "ICT Manager", flag: r.iCTManagerApproved },
        { role: "HC Systems Officer", flag: r.hCSystemsAdminApproved },
      ];

  if (status === "Draft") {
    return stages.map((stage) => ({
      name: stage.role,
      role: stage.role,
      status: "waiting" as const,
      actionLabel: "Not submitted",
    }));
  }

  let pendingSeen = false;
  return stages.map((stage) => {
    if (stage.flag === true) {
      return {
        name: stage.role,
        role: stage.role,
        status: stage.role.includes("Training")
          ? ("training-verified" as const)
          : stage.role.includes("HC")
            ? ("implemented" as const)
            : ("approved" as const),
        actionLabel: stage.role.includes("Training")
          ? "Training Verified"
          : stage.role.includes("HC")
            ? "Implemented"
            : "Approved",
      };
    }
    if (stage.flag === false) {
      return {
        name: stage.role,
        role: stage.role,
        status: "rejected" as const,
        actionLabel: status === "Cancelled" ? "Cancelled" : "Rejected & Closed",
        comments: r.rejectionReason ?? undefined,
      };
    }
    if (isClosed) {
      return {
        name: stage.role,
        role: stage.role,
        status: "closed" as const,
        actionLabel: status === "Cancelled" ? "Cancelled" : "Cancelled after rejection",
      };
    }
    if (!pendingSeen) {
      pendingSeen = true;
      return { name: stage.role, role: stage.role, status: "pending" as const };
    }
    return { name: stage.role, role: stage.role, status: "waiting" as const };
  });
}

export function mapRequestDetailsToApp(r: RequestDetails): AppRequest {
  const isContractor = (r.userType ?? "").toLowerCase() === "contractor";
  const c = r.contractor;
  const employee =
    (isContractor && c
      ? `${c.firstName ?? ""} ${c.surname ?? ""}`.trim()
      : null) ||
    r.employeeName?.trim() ||
    r.contractorName?.trim() ||
    r.companyName?.trim() ||
    r.employeeEmail ||
    "—";

  return {
    id: r.requestNumber ?? `EAM-${r.id}`,
    numericId: r.id,
    type: r.requestType ?? "Other",
    employee,
    serviceNumber: isContractor ? "" : (r.serviceNumber ?? ""),
    department: (isContractor ? (c?.department ?? r.contractorDepartment) : r.department) ?? "—",
    branch: (isContractor ? (c?.branch ?? r.contractorBranch) : r.branch) ?? "—",
    env: mapEnvironmentFromApi(r.environment),
    status: mapApiStatusToApp(r.status),
    submitted: (r.requestedDate ?? "").slice(0, 10),
    approvers: buildApprovers(r),
    isContractor,
    docsUploaded: true,
    expiryDate: r.endDate?.slice(0, 10),
    email: isContractor ? (c?.emailAddress ?? r.contractorEmailAddress ?? undefined) : (r.employeeEmail ?? undefined),
    adUsername: r.activeDirectoryUsername ?? undefined,
    accessLevel: r.userAccessType ?? undefined,
    ellipsePosition: r.ellipsePosition ?? undefined,
    menuAccess: r.menuAccess ?? undefined,
    businessJustification: r.businessJustification ?? undefined,
    startDate: r.startDate?.slice(0, 10),
    contractorCompany: (isContractor ? (c?.companyName ?? r.companyName) : r.companyName) ?? undefined,
    contractorId: (isContractor
      ? (c?.identificationNumber ?? r.contractorIdentificationNumber ?? (r.contractId != null ? String(r.contractId) : undefined))
      : (r.contractId != null ? String(r.contractId) : undefined)),
    responsibleManager: (isContractor ? (c?.responsibleManager ?? r.contractorResponsibleManager) : undefined) ?? undefined,
    contactNumber: (isContractor ? (r.contractorContactNumber ?? undefined) : undefined),
    rejectionReason: r.rejectionReason ?? undefined,
  };
}

export function logoutApiIdentity(): void {
  setAuthToken(null);
  sessionStorage.removeItem("email");
  sessionStorage.removeItem("access_token");
}

export function login(email: string, token: string): void {
  sessionStorage.setItem("email", email);
  setAuthToken(token);
}

export async function fetchAppRequests(): Promise<AppRequest[]> {
  const rows = await requestsApi.getAll();
  return (rows ?? []).map(mapRequestDetailsToApp);
}

export async function fetchAppRequestById(requestId: number): Promise<AppRequest> {
  const row = await requestsApi.getById(requestId);
  return mapRequestDetailsToApp(row);
}

function toIsoDate(value: string, fallbackToday = true): string {
  if (value?.trim()) {
    return new Date(`${value.trim()}T00:00:00.000Z`).toISOString();
  }
  if (fallbackToday) return new Date().toISOString();
  throw new Error("Date is required.");
}

export interface EmployeeSubmitInput {
  requestType: string;
  isTerminate: boolean;
  environments: Array<"PROD" | "TEST" | "DEV">;
  userAccessType?: string;
  firstName: string | undefined;
  surname: string | undefined;
  serviceNumber: string;
  email?: string;
  adUsername?: string;
  postId?: string;
  permanentPostId?: string;
  actingPostId?: string;
  department?: string;
  branch?: string;
  designation?: string;
  contactNumber?: string;
  ellipsePosition?: string;
  positionToCopy?: string;
  menuAccess?: string;
  businessJustification?: string;
  startDate?: string;
  endDate?: string;
  terminationDate?: string;
  terminationReason?: string;
  identityFile?: File | null;
  responsibleManager?: string | null;
}

async function createAndSubmit(payload: NewRequestDetails, identityFile?: File | null) {
  const created = await requestsApi.create({ ...payload, submit: false });
  if (identityFile) {
    try {
      await documentsApi.upload(
        created.id,
        "Identity Document",
        "Employee Identity Document",
        identityFile,
      );
    } catch {
      // Document upload is best-effort for terminations; required for create flows.
      if (!String(payload.requestType ?? "").toLowerCase().includes("terminate")) {
        throw new Error("Request created but identity document upload failed.");
      }
    }
  }
  const refreshed = await requestsApi.getById(created.id).catch(() => created);
  return refreshed;
}

export async function submitEmployeeAccessRequest(
  input: EmployeeSubmitInput,
): Promise<AppRequest[]> {
  const envs =
    input.environments.length > 0 ? input.environments : (["PROD"] as const);

  const results: AppRequest[] = [];
  for (const env of envs) {
    const isTerminate = input.isTerminate;
    const startDate = toIsoDate(
      isTerminate ? input.terminationDate || "" : input.startDate || "",
    );
    const endDate =
      !isTerminate && input.endDate ? toIsoDate(input.endDate, false) : null;

    const payload: NewRequestDetails = {
      requestType: input.requestType,
      environment: mapEnvironmentToApi(env),
      userAccessType: isTerminate ? null : input.userAccessType || null,
      ellipsePosition: isTerminate ? "N/A" : input.ellipsePosition?.trim() || "N/A",
      positionToCopy: input.positionToCopy?.trim() || null,
      menuAccess: isTerminate ? "N/A" : input.menuAccess?.trim() || "N/A",
      businessJustification: isTerminate
        ? input.terminationReason?.trim() || "Termination"
        : input.businessJustification?.trim() || "",
      additionalUserAccess: "None",
      startDate,
      endDate,
      userType: "Employee",
      temporaryPostId: input.actingPostId || null,
      permanentPostId: input.permanentPostId || input.postId || null,
      submit: false,
      employee:
      {
        branch: input.branch,
        postId: input.postId ?? input.permanentPostId ?? "",
        activeDirectoryUsername: input.adUsername,
        contactNumber: input.contactNumber,
        department: input.department,
        designation: input.designation,
        emailAddress: input.email,
        firstName: input.firstName,
        serviceNumber: input.serviceNumber,
        surname: input.surname,
        responsibleManager: input.responsibleManager,
        requests: []
      }
    };

    try {
      const created = await createAndSubmit(payload, input.identityFile);
      results.push(mapRequestDetailsToApp(created));
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  }

  return results;
}

export interface ContractorSubmitInput {
  isTermination: boolean;
  environment: "PROD" | "TEST" | "DEV";
  firstName: string;
  surname: string;
  companyName: string;
  identificationNumber: string;
  email: string;
  contactNumber?: string;
  department?: string;
  branch?: string;
  responsibleManager: string;
  businessJustification?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  terminationDate?: string;
  terminationReason?: string;
  ellipsePosition?: string;
  menuAccess?: string;
  userAccessType?: string;
  positionToCopy?: string;
  requestType?: string;
  identityFile?: File | null;
  contractorCardFile?: File | null;
  contractFile?: File | null;
}

export async function submitContractorRequest(
  input: ContractorSubmitInput,
): Promise<AppRequest> {
  try {
    const payload: NewRequestDetails = {
      requestType: input.isTermination
        ? "Terminate & Delete Signon"
        : "New Employee & Create Signon",
      environment: mapEnvironmentToApi(input.environment),
      userAccessType: input.isTermination ? null : input.userAccessType || "Temporary/Acting",
      ellipsePosition: input.isTermination ? "N/A" : input.ellipsePosition?.trim() || "N/A",
      positionToCopy: input.positionToCopy?.trim() || null,
      menuAccess: input.isTermination ? "N/A" : input.menuAccess?.trim() || "N/A",
      businessJustification: input.isTermination
        ? input.terminationReason?.trim() || "Contractor termination"
        : input.businessJustification?.trim() || "",
      additionalUserAccess: "None",
      startDate: toIsoDate(
        input.isTermination ? input.terminationDate || "" : input.contractStartDate || "",
      ),
      endDate: input.isTermination
        ? null
        : toIsoDate(input.contractEndDate || input.contractStartDate || "", false),
      userType: "Contractor",
      contractId: null,
      submit: false,
      contractor: {
        endDate: input.contractEndDate ?? "",
        startDate: input.contractStartDate ?? "",
        branch: input.branch,
        businessJustification: input.businessJustification,
        companyName: input.companyName,
        department: input.department,
        emailAddress: input.email,
        firstName: input.firstName,
        surname: input.surname,
        identificationNumber: input.identificationNumber,
        responsibleManager: input.responsibleManager
      }
    };

    const created = await requestsApi.create({ ...payload, submit: false });

    if (!input.isTermination) {
      if (input.identityFile) {
        await documentsApi.upload(created.id, "Identity Document", "ID / Passport", input.identityFile);
      }
      if (input.contractorCardFile) {
        await documentsApi.upload(
          created.id,
          "Contractor Identification Card",
          "Contractor Identification Card",
          input.contractorCardFile,
        );
      }
      if (input.contractFile) {
        await documentsApi.upload(
          created.id,
          "Contract",
          "Contract Documentation",
          input.contractFile,
        );
      }
    }

    const refreshed = await requestsApi.getById(created.id).catch(() => created);
    return mapRequestDetailsToApp(refreshed);
  } catch (err) {
    throw new Error(apiErrorMessage(err));
  }
}

export async function approveRequestApi(
  requestId: number,
  role: string,
  options?: { trainingDate?: string; verifiedBy?: string },
): Promise<void> {
  try {
    if (role === "LINE_MANAGER") {
      await requestsApi.lineManagerApprove(requestId);
      return;
    }
    if (role === "TRAINING_CENTRE") {
      const trainingDate = options?.trainingDate?.trim()
        ? new Date(options.trainingDate).toISOString()
        : new Date().toISOString();
      await requestsApi.trainingVerify(
        requestId,
        trainingDate,
        options?.verifiedBy?.trim() || "Training Centre",
      );
      return;
    }
    if (role === "ICT_MANAGER") {
      await requestsApi.ictApprove(requestId);
      return;
    }
    throw new Error("Current role cannot approve this request.");
  } catch (err) {
    throw new Error(apiErrorMessage(err));
  }
}

export async function rejectRequestApi(
  requestId: number,
  role: string,
  reason: string,
): Promise<void> {
  try {
    if (role === "LINE_MANAGER") {
      await requestsApi.lineManagerReject(requestId, reason);
      return;
    }
    if (role === "TRAINING_CENTRE") {
      await requestsApi.trainingUnverify(requestId, reason);
      return;
    }
    if (role === "ICT_MANAGER") {
      await requestsApi.ictReject(requestId, reason);
      return;
    }
    if (role === "HC_SYSTEMS_OFFICER") {
      await requestsApi.hcReject(requestId, reason);
      return;
    }
    throw new Error("Current role cannot reject this request.");
  } catch (err) {
    throw new Error(apiErrorMessage(err));
  }
}

export async function implementRequestApi(
  requestId: number,
  body: ImplementRequestDetails,
): Promise<void> {
  try {
    await requestsApi.hcImplement(requestId, body);
  } catch (err) {
    console.log(err);
    throw new Error(apiErrorMessage(err));
  }
}

export async function returnForAmendmentApi(
  requestId: number,
  body: ReturnForAmendmentDetails,
): Promise<void> {
  try {
    await requestsApi.returnForAmendment(requestId, body);
  } catch (err) {
    throw new Error(apiErrorMessage(err));
  }
}

export async function resubmitAmendmentApi(
  requestId: number,
  uploads: Array<{ documentType: string; documentCategory: string; file: File }>,
): Promise<void> {
  try {
    for (const upload of uploads) {
      await documentsApi.upload(
        requestId,
        upload.documentType,
        upload.documentCategory,
        upload.file,
      );
    }
    await requestsApi.resubmitAmendment(requestId);
  } catch (err) {
    throw new Error(apiErrorMessage(err));
  }
}