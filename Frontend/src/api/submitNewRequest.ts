import { createContractor } from "./directoryApi";
import { createDocument, fileToBase64 } from "./documentsApi";
import { useApiMocks } from "./http";
import { createRequest, getRequest } from "./requestsApi";
import type { ContractorDetails, RequestDetails } from "./types";
import { isTemporaryActing, type NewRequestDraft } from "../features/requests/wizardTypes";

export interface WizardDocumentFile {
  name: string;
  file: File;
}

export interface WizardDocuments {
  identity?: WizardDocumentFile;
  contractorCard?: WizardDocumentFile;
  contract?: WizardDocumentFile;
}

export interface SubmitNewRequestResult {
  request: RequestDetails;
  source: "api" | "mock";
  documentErrors: string[];
}

function toIsoDate(value: string, fallbackNow = true): string {
  if (value) return new Date(value).toISOString();
  return fallbackNow ? new Date().toISOString() : new Date().toISOString();
}

async function ensureContractor(draft: NewRequestDraft, managerName: string): Promise<number | null> {
  const payload: ContractorDetails = {
    id: 0,
    firstName: draft.firstName.trim(),
    surname: draft.surname.trim(),
    emailAddress: draft.email.trim(),
    companyName: draft.companyName.trim(),
    identificationNumber: draft.idOrPassportNumber.trim(),
    responsibleManager: managerName,
    businessJustification: draft.businessJustification.trim(),
    department: draft.department,
    branch: draft.branch,
    startDate: toIsoDate(draft.startDate),
    endDate: toIsoDate(draft.endDate || draft.startDate),
  };

  try {
    const created = await createContractor(payload);
    if (created && typeof created === "object" && "id" in created) {
      return Number((created as ContractorDetails).id) || null;
    }
  } catch {
    // Contractor create optional if already present
  }
  return null;
}

async function uploadDocs(
  requestId: number,
  docs: WizardDocuments,
): Promise<string[]> {
  const errors: string[] = [];
  const uploads: Array<{ type: string; doc?: WizardDocumentFile }> = [
    { type: "Identity Document", doc: docs.identity },
    { type: "Contractor Card", doc: docs.contractorCard },
    { type: "Contract", doc: docs.contract },
  ];

  for (const item of uploads) {
    if (!item.doc) continue;
    try {
      const data = await fileToBase64(item.doc.file);
      await createDocument({
        id: 0,
        data,
        dateUploaded: new Date().toISOString(),
        documentType: `${item.type}: ${item.doc.name}`,
        requestId,
        active: true,
        archived: false,
      });
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `${item.type}: ${error.message}`
          : `${item.type}: upload failed`,
      );
    }
  }
  return errors;
}

/** Create + submit a new access request via Ellipse API, or return a mock result. */
export async function submitNewRequest(input: {
  draft: NewRequestDraft;
  documents: WizardDocuments;
  managerName?: string;
}): Promise<SubmitNewRequestResult> {
  const { draft, documents, managerName = "" } = input;

  if (useApiMocks()) {
    const id = 990 + Math.floor(Math.random() * 9);
    return {
      source: "mock",
      documentErrors: [],
      request: {
        id,
        requestNumber: `EAM-2026-${String(id).padStart(3, "0")}`,
        status: "PendingApproval",
        startDate: toIsoDate(draft.startDate),
        endDate: draft.endDate ? toIsoDate(draft.endDate) : null,
        requestedDate: new Date().toISOString(),
        requestType: draft.requestType,
        environment: mapEnvironmentName(draft.environment),
        employeeEmail: draft.email,
        userType: draft.applicantKind,
        businessJustification: draft.businessJustification,
      },
    };
  }

  let contractId: number | null =
    draft.applicantKind === "Contractor" && draft.contractId.trim()
      ? Number.parseInt(draft.contractId.trim(), 10) || null
      : null;

  if (draft.applicantKind === "Contractor") {
    if (!contractId || contractId <= 0) {
      contractId = await ensureContractor(draft, managerName);
    }
    if (!contractId || contractId <= 0) {
      throw new Error(
        "Contractor master record is required. Register or select a contractor before submitting.",
      );
    }
  }

  // 1) Create as Draft so documents can be attached before workflow entry.
  //    Employee master is provisioned by the API when missing (no admin Employee POST).
  const created = await createRequest({
    requestType: draft.requestType,
    environment: mapEnvironmentName(draft.environment),
    userAccessType: draft.userAccessType || null,
    ellipsePosition: draft.ellipsePosition.trim(),
    positionToCopy: draft.positionToCopy.trim() || null,
    menuAccess: draft.menuAccess.trim(),
    businessJustification: draft.businessJustification.trim(),
    additionalUserAccess: draft.positionToCopy.trim()
      ? `Copy:${draft.positionToCopy.trim()}`.slice(0, 50)
      : "None",
    startDate: toIsoDate(draft.startDate),
    endDate: draft.endDate ? toIsoDate(draft.endDate) : null,
    userType: draft.applicantKind,
    employeeEmail:
      draft.applicantKind === "Employee" && draft.email.trim()
        ? draft.email.trim()
        : null,
    firstName: draft.firstName.trim() || null,
    surname: draft.surname.trim() || null,
    serviceNumber: draft.serviceNumber.trim() || null,
    department: draft.department || null,
    branch: draft.branch || null,
    contactNumber: draft.phoneWork.trim() || null,
    activeDirectoryUsername: draft.activeDirectoryId.trim() || null,
    designation: draft.designation.trim() || null,
    postId: Number(draft.postId) || null,
    contractId,
    temporaryPosition: isTemporaryActing(draft) ? draft.ellipsePosition.trim() : null,
    temporaryPostId: isTemporaryActing(draft) ? Number(draft.postId) || null : null,
    permanentPostId: Number(draft.postId) || null,
    submit: false,
  });

  // 2) Upload supporting documents while still Draft.
  const documentErrors = await uploadDocs(created.id, documents);
  if (draft.applicantKind === "Contractor" && documentErrors.length > 0) {
    throw new Error(
      `Contractor documents are required before submit: ${documentErrors.join("; ")}`,
    );
  }

  let finalRequest: RequestDetails = {
    ...created,
    status: "PendingApproval",
  };
  try {
    finalRequest = await getRequest(created.id);
  } catch {
    // Keep PendingApproval assumption if refresh fails.
  }

  return {
    source: "api",
    request: {
      ...finalRequest,
      requestNumber: finalRequest.requestNumber ?? created.requestNumber ?? `EAM-${created.id}`,
    },
    documentErrors,
  };
}

function mapEnvironmentName(code: NewRequestDraft["environment"]): string {
  if (code === "PROD") return "Production";
  if (code === "TEST") return "Test";
  if (code === "DEV") return "Development";
  return "Test";
}

