import { getApprovalsForRequest } from "./directoryApi";
import { ApiError } from "./http";
import { mapRequestToDetail, mapRequestToSummary } from "./mappers";
import {
  getRequest,
  getRequests,
  hcImplement,
  hcReject,
  ictApprove,
  ictReject,
  lineManagerApprove,
  lineManagerReject,
  searchRequests,
  trainingUnverify,
  trainingVerify,
} from "./requestsApi";
import type {  UserRole } from "../types";
import type { AccessRequestDetail } from "../types/AccessRequestDetail";
import type { AccessRequestSummary } from "../types/AccessRequestSummary";

export async function loadRequestSummaries(
  search?: string,
): Promise<{ items: AccessRequestSummary[]; source: "api" | "mock"; error?: string }> {
  if (useApiMocks()) {
    return { items: listRequestSummaries(), source: "mock" };
  }

  try {
    const raw =
      search && search.trim()
        ? await searchRequests(search.trim())
        : await getRequests();
    return { items: raw.map(mapRequestToSummary), source: "api" };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "API unavailable";
    return {
      items: listRequestSummaries(),
      source: "mock",
      error: `${message} — showing demo data.`,
    };
  }
}

export async function loadRequestDetail(
  id: string,
): Promise<{ item?: AccessRequestDetail; source: "api" | "mock"; error?: string }> {
  if (useApiMocks()) {
    return { item: getRequestDetail(id), source: "mock" };
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { item: getRequestDetail(id), source: "mock" };
  }

  try {
    const [request, approvals] = await Promise.all([
      getRequest(numericId),
      getApprovalsForRequest(numericId).catch(() => []),
    ]);
    return { item: mapRequestToDetail(request, approvals), source: "api" };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "API unavailable";
    return {
      item: getRequestDetail(id),
      source: "mock",
      error: `${message} — showing demo data.`,
    };
  }
}

export async function approveRequestViaApi(input: {
  id: string;
  role: UserRole;
  environment: string;
  comments?: string;
  training?: {
    trainingCompleted: boolean;
    completionDate: string;
    verifiedByName: string;
  };
  closure?: {
    ellipseUpdateDate: string;
    comments: string;
  };
}): Promise<void> {
  const requestId = Number(input.id);
  if (!Number.isFinite(requestId)) {
    throw new Error("Invalid request id for API approval.");
  }

  if (input.role === "Line Manager" || input.role === "Deputy Head") {
    await lineManagerApprove(requestId);
    return;
  }
  if (input.role === "ICT Manager") {
    await ictApprove(requestId);
    return;
  }
  if (input.role === "Training Centre") {
    if (!input.training?.trainingCompleted) {
      await trainingUnverify(requestId);
      return;
    }
    await trainingVerify(
      requestId,
      new Date(input.training.completionDate).toISOString(),
      input.training.verifiedByName,
    );
    return;
  }
  if (input.role === "HC Systems Administrator") {
    await hcImplement(requestId, {
      ellipseUserId: 0,
      dateAccessGranted: new Date().toISOString(),
      ellipseUserUpdateDate: input.closure?.ellipseUpdateDate
        ? new Date(input.closure.ellipseUpdateDate).toISOString()
        : new Date().toISOString(),
      closureOutcome: "Implemented",
      implementationComments: input.closure?.comments ?? input.comments ?? "",
    });
  }
}

export async function rejectRequestViaApi(input: {
  id: string;
  role: UserRole;
  comments: string;
}): Promise<void> {
  const requestId = Number(input.id);
  if (!Number.isFinite(requestId)) {
    throw new Error("Invalid request id for API rejection.");
  }
  const reason = input.comments || "Rejected";

  if (input.role === "Line Manager" || input.role === "Deputy Head") {
    await lineManagerReject(requestId, reason);
    return;
  }
  if (input.role === "ICT Manager") {
    await ictReject(requestId, reason);
    return;
  }
  if (input.role === "Training Centre") {
    await trainingUnverify(requestId);
    return;
  }
  if (input.role === "HC Systems Administrator") {
    await hcReject(requestId, reason);
  }
}

export {
  currentApproverRole,
  decideRequest,
  logDocumentView,
  useApiMocks,
};
