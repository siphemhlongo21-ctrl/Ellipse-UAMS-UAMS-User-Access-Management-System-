import { type DocumentDetails } from "../api";
import { documentsApi } from "../api";
import type { ViewerDocument } from "../types/ViewerDocument";

export function isAwaitingAmendment(status: string): boolean {
    return status === "awaiting-information" || status === "Awaiting Resubmission";
}

export function formatBytes(bytes?: number | null): string {
    if (bytes == null) return "—";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Preview for a file the user just picked, before it reaches the server. */
export function fileToViewerDocument(label: string, file: File, uploadedBy?: string): ViewerDocument {
 const objectUrl = URL.createObjectURL(file);
    return {
        id: `local-${label.replace(/[^a-zA-Z0-9]+/g, "_")}`,
        name: label,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: formatBytes(file.size),
        uploadedAt: new Date().toISOString().slice(0, 10),
        uploadedBy: uploadedBy ?? "Current user",
        previewUrl: objectUrl,
        downloadUrl: objectUrl,
    };
}

/**
 * Loads the stored file so the viewer shows the real document. Without the blob
 * the viewer falls back to its placeholder rendering.
 */
export async function loadServerViewerDocument(doc: DocumentDetails): Promise<ViewerDocument> {
    const fallbackName = doc.fileName || doc.documentType || `Document-${doc.id}`;
    const base: ViewerDocument = {
        id: String(doc.id),
        name: doc.documentType || fallbackName,
        fileName: fallbackName,
        contentType: doc.contentType || undefined,
        size: formatBytes(doc.contentLength),
        uploadedAt: doc.dateUploaded ? String(doc.dateUploaded).slice(0, 10) : undefined,
        uploadedBy: doc.documentCategory || undefined,
    };

    try {
        const { blob, fileName } = await documentsApi.downloadBlob(doc.id);
        const objectUrl = URL.createObjectURL(blob);
        return {
            ...base,
            fileName: doc.fileName || fileName || fallbackName,
            contentType: doc.contentType || blob.type || undefined,
            size: formatBytes(doc.contentLength ?? blob.size),
            previewUrl: objectUrl,
            downloadUrl: objectUrl,
        };
    } catch {
        return base;
    }
}

export function revokeViewerDocument(doc: ViewerDocument | null) {
    if (doc?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(doc.previewUrl);
    }
}

/** Next step after a workflow action — environment / type aware. */
export function getNextWorkflowStep(
    req: { environment?: string | null; userAccessType?: string | null },
    action: "line-manager-approve" | "training-verify" | "ict-approve",
): { forwardMessage: string; statusLabel: string; statusCls: string } {
    const isTerminate = TERMINATE_REQ_TYPES.includes(req.userAccessType ?? "");
    const isProdPath = req.environment === "Production" || req.environment === "ALL";


    if (action === "line-manager-approve") {
        if (isTerminate) {
            return {
                forwardMessage: "The request has been forwarded to the HC Systems Officer for implementation.",
                statusLabel: "Pending HC Systems Officer Implementation",
                statusCls: "bg-indigo-100 text-indigo-700 border-indigo-200",
            };
        }
        if (isProdPath) {
            return {
                forwardMessage: "The request has been forwarded to the Training Centre for verification.",
                statusLabel: "Pending Training Centre Verification",
                statusCls: "bg-teal-100 text-teal-700 border-teal-200",
            };
        }
        return {
            forwardMessage: "The request has been forwarded to the ICT Manager for approval.",
            statusLabel: "Pending ICT Manager Approval",
            statusCls: "bg-sky-100 text-sky-700 border-sky-200",
        };
    }

    if (action === "training-verify") {
        // PROD path: Training Centre → HC Systems Officer (ICT is TEST/DEV only)
        return {
            forwardMessage: "Training verified. The request has been forwarded to the HC Systems Officer for implementation.",
            statusLabel: "Pending HC Systems Officer Implementation",
            statusCls: "bg-indigo-100 text-indigo-700 border-indigo-200",
        };
    }

    // ict-approve
    return {
        forwardMessage: "The request has been forwarded to the HC Systems Officer for implementation.",
        statusLabel: "Pending HC Systems Officer Implementation",
        statusCls: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
}

export const ROLE_LABELS: Record<string, string> = {
    "EMPLOYEE": "Employee",
    "LINE_MANAGER": "Line Manager",
    "TRAINING_CENTRE": "Training Centre Representative",
    "ICT_MANAGER": "ICT Manager",
    "HC_SYSTEMS_OFFICER": "HC Systems Officer",
    "SYSTEM_ADMIN": "System Admin",
};

export const DEV_REPORTING_LINE_USERS: Partial<Record<string, string>> = {
    "EMPLOYEE": "DEV\\ellipse.employee",
    "LINE_MANAGER": "DEV\\ellipse.lm",
    "TRAINING_CENTRE": "DEV\\ellipse.training",
    "ICT_MANAGER": "DEV\\ellipse.ict",
    "HC_SYSTEMS_OFFICER": "DEV\\ellipse.hc",
};

export const TERMINATE_REQ_TYPES: string[] = [
    "Terminate & Delete Signon",
    "Terminate Secondary Position",
];

export interface RequestApproverActionDetails {
    id?: number;
    requestId?: number;
    approverType?: string | null;
    name?: string | null;
    actionType?: string | null;
    approverDate?: string | null;
    rejectionReason?: string | null;
}

/**
 * Generates a unified workflow timeline by combining completed approval history
 * with calculated upcoming pending and not-started steps.
 */
export function buildFullTimeline(
    req: { status?: string | null; environment?: string | null; userAccessType?: string | null; requestType?: string | null } | null,
    approvers: RequestApproverActionDetails[] | null
): RequestApproverActionDetails[] {
    if (!req) return [];

    const list = Array.isArray(approvers) ? [...approvers] : [];
    const statusLower = (req.status ?? "").toLowerCase();

    const isTerminate =
        TERMINATE_REQ_TYPES.includes(req.userAccessType ?? "") ||
        TERMINATE_REQ_TYPES.includes(req.requestType ?? "");
    const isProdPath = String(req.environment ?? "").toUpperCase().includes("PROD");

    const steps: string[] = ["Line Manager"];
    if (!isTerminate) {
        steps.push(isProdPath ? "Training Centre" : "ICT Manager");
    }
    steps.push("HC Systems Officer");

    const norm = (s?: string | null) =>
        (s ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/representative/g, "").replace(/\s+/g, " ").trim();

    const matchesStep = (approverType: string | null | undefined, stepName: string) => {
        const t = norm(approverType);
        const s = norm(stepName);
        if (!t) return false;
        if (t.includes(s) || s.includes(t)) return true;
        if (s === "line manager" && t.includes("line") && t.includes("manager")) return true;
        if (s === "training centre" && t.includes("training")) return true;
        if (s === "ict manager" && t.includes("ict")) return true;
        if (s === "hc systems officer" && (t.includes("hc") || t.includes("systems officer"))) return true;
        return false;
    };

    const toBadge = (action?: string | null): string | null => {
        const a = norm(action);
        if (!a) return null;
        if (a.includes("reject")) return "Rejected";
        if (a.includes("close")) return "Closed";
        if (a.includes("return") || a.includes("amend")) return "Returned";
        if (a.includes("implement")) return "Implemented";
        if (a.includes("verif")) return "Verified";
        if (a.includes("approv")) return "Approved";
        if (a.includes("pending")) return "Pending";
        if (a.includes("wait")) return "Waiting";
        return action ?? null;
    };

    const isFinished = (b?: string | null) =>
        b === "Approved" || b === "Verified" || b === "Implemented" || b === "Rejected" || b === "Closed";

    const findExisting = (stepName: string) =>
        [...list].reverse().find(a => matchesStep(a.approverType, stepName));

    let currentIndex = 0;
    if (statusLower.includes("training")) currentIndex = steps.indexOf("Training Centre");
    else if (statusLower.includes("ict")) currentIndex = steps.indexOf("ICT Manager");
    else if (
        statusLower.includes("implementation") ||
        statusLower.includes("hc") ||
        statusLower.includes("resubmission") ||
        statusLower.includes("information") ||
        statusLower.includes("amendment")
    ) {
        currentIndex = steps.indexOf("HC Systems Officer");
    } else {
        currentIndex = 0;
    }
    if (currentIndex < 0) currentIndex = 0;

    steps.forEach((stepName, i) => {
        const badge = toBadge(findExisting(stepName)?.actionType);
        if (isFinished(badge) && badge !== "Rejected" && badge !== "Closed" && currentIndex <= i) {
            currentIndex = i + 1;
        }
    });

    const allComplete =
        (statusLower.includes("implemented") && !statusLower.includes("pending")) ||
        statusLower.includes("completed");
    const isAmendment =
        statusLower.includes("information") ||
        statusLower.includes("resubmission") ||
        statusLower.includes("amendment");

    const rejected = list.find(a => {
        const b = toBadge(a.actionType);
        return b === "Rejected" || b === "Closed";
    });
    const rejectedIndex = rejected
        ? steps.findIndex(s => matchesStep(rejected.approverType, s))
        : -1;

    return steps.map((stepName, i) => {
        const existing = findExisting(stepName);
        const existingBadge = toBadge(existing?.actionType);
        const person =
            existing?.name && existing.name !== "Awaiting Assignment"
                ? existing.name
                : stepName;

        if (rejectedIndex >= 0) {
            if (i === rejectedIndex) {
                return {
                    approverType: stepName,
                    name: person,
                    actionType: "Rejected",
                    approverDate: existing?.approverDate ?? null,
                    rejectionReason: existing?.rejectionReason ?? null,
                };
            }
            if (i > rejectedIndex) {
                return {
                    approverType: stepName,
                    name: stepName,
                    actionType: "Closed",
                    approverDate: null,
                    rejectionReason: null,
                };
            }
        }

        if (allComplete || i < currentIndex) {
            const doneType =
                existingBadge && isFinished(existingBadge)
                    ? existingBadge
                    : stepName === "Training Centre"
                        ? "Verified"
                        : stepName === "HC Systems Officer" && allComplete
                            ? "Implemented"
                            : "Approved";
            return {
                approverType: stepName,
                name: person,
                actionType: doneType,
                approverDate: existing?.approverDate ?? null,
                rejectionReason: existing?.rejectionReason ?? null,
            };
        }

        if (i === currentIndex) {
            return {
                approverType: stepName,
                name: person,
                actionType: isAmendment ? "Returned" : "Pending",
                approverDate: existing?.approverDate ?? null,
                rejectionReason: existing?.rejectionReason ?? null,
            };
        }

        return {
            approverType: stepName,
            name: stepName,
            actionType: "Waiting",
            approverDate: null,
            rejectionReason: null,
        };
    });
}