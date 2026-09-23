import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { DocumentViewerModal } from "../../components/DocumentViewerModal";
import { type DocumentDetails, type RequestApproverActionDetails, type RequestDetails } from "../../api";
import { approveRequestApi, implementRequestApi, rejectRequestApi, resubmitAmendmentApi, returnForAmendmentApi } from "../../app/apiBridge";
import {
    CheckCircle2, XCircle, AlertCircle, Upload,
    Shield, Zap, Eye,
    CalendarRange,
    X, Check,
    MessageSquare,
    RotateCcw,
    Loader
} from "lucide-react";
import { type DocumentAccessLogEntry } from "../../types/DocumentAccessLogEntry";
import { type ViewerDocument } from "../../types/ViewerDocument";
import { revokeViewerDocument, isAwaitingAmendment } from "../../utilities";
import { EnvBadge } from "../controls/EnvBadge";
import { getNextWorkflowStep, ROLE_LABELS, loadServerViewerDocument, fileToViewerDocument, formatBytes } from "../../utilities";
import { hasAppRole } from "../../utilities/request";
import { StatusBadge } from "../controls/StatusBadge";
import { useAuth } from "../../context/AuthProvider";
import { requestApprovalApi } from "../../api";
import { documentsApi } from "../../api";
import { WorkflowSteps } from "./WorkflowSteps";
import { WorkflowAuditRows } from "./WorkflowAuditRows";
import { INITIAL_DOC_ACCESS_LOG } from "../../types"
import type { UserRole } from "../../types/UserRole";
import { formatDate, formatDateTime } from "../../api/mappers";

// ─── Request Detail Panel ─────────────────────────────────────────────────────

export function RequestDetail({ req: incomingReq, onClose }: { req: RequestDetails | null; onClose: () => void; onReload?: () => void }) {
    const { session } = useAuth();
    const [req, setReq] = useState(incomingReq);
    useEffect(() => { setReq(incomingReq); }, [incomingReq]);
    const showApprove = ["ICT_MANAGER", "HC_SYSTEMS_OFFICER", "LINE_MANAGER", "TRAINING_CENTRE"].some(r => session?.roles?.includes(r));
    const showReload = hasAppRole(session?.roles, "HC_SYSTEMS_OFFICER");
    const showDocView = hasAppRole(session?.roles, "ICT_MANAGER", "HC_SYSTEMS_OFFICER");
    const [reloadComment, setReloadComment] = useState("");
    const [showReloadBox, setShowReloadBox] = useState(false);
    const [trainingDate, setTrainingDate] = useState("");
    const [trainingDateError, setTrainingDateError] = useState(false);
    const [resubmitSent, setResubmitSent] = useState(false);
    const [flaggedDocs, setFlaggedDocs] = useState<string[]>([]);
    const [uploadedResubDocs, setUploadedResubDocs] = useState<string[]>([]);
    // Workflow action states for LM / TC
    const [actionState, setActionState] = useState<"idle" | "approved" | "rejected" | "verified">("idle");
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectComment, setRejectComment] = useState("");
    const [, setRejectType] = useState<"send-back" | "close" | null>(null);
    const [apiBusy, setApiBusy] = useState(false);
    const [apiActionError, setApiActionError] = useState<string | null>(null);
    const [confirmDismissed, setConfirmDismissed] = useState(false);
    useEffect(() => { setConfirmDismissed(false); }, [actionState]);
    const toggleFlaggedDoc = (d: string) =>
        setFlaggedDocs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    // HC Admin implementation verification — auto-fill from session
    // HC Systems Officer implementation fields
    const [implDetails, setImplDetails] = useState({
        ellipseUserId: "",
        dateAccessGranted: "",
        implementedBy: session?.displayName ?? "",
        comments: "",
    });
    const [implActionState, setImplActionState] = useState<"idle" | "implemented" | "rejected" | "resubmit-sent">("idle");
    const [implRejectMode, setImplRejectMode] = useState(false);
    const [implRejectComment, setImplRejectComment] = useState("");
    const [, setImplRejectType] = useState<"send-back" | "close" | null>(null);
    const [viewingDoc, setViewingDoc] = useState<ViewerDocument | null>(null);
    const [loadingDocId, setLoadingDocId] = useState<number | null>(null);
    const [uploadTargetDoc, setUploadTargetDoc] = useState<string | null>(null);
    const [docAccessLog, setDocAccessLog] = useState<DocumentAccessLogEntry[]>(INITIAL_DOC_ACCESS_LOG);
    const [requestDocs, setRequestDocs] = useState<DocumentDetails[]>([]);
    const [requestDocsLoading, setRequestDocsLoading] = useState(false);
    const [archivedDocs, setArchivedDocs] = useState<DocumentDetails[]>([]);
    const [showArchivedDocs, setShowArchivedDocs] = useState(false);
    const [archivedDocsLoading, setArchivedDocsLoading] = useState(false);
    const [archivedDocsError, setArchivedDocsError] = useState<string | null>(null);
    const [documentActionId, setDocumentActionId] = useState<number | null>(null);
    const [pendingResubFiles, setPendingResubFiles] = useState<Record<string, File>>({});
    const [mandatoryVerified, setMandatoryVerified] = useState(false);
    const [viewedDocIds, setViewedDocIds] = useState<number[]>([]);
    const [contractorDocsVerified, setContractorDocsVerified] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    function toDateInputValue(value?: string | null) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return String(value).slice(0, 10);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function formatRequestedDate(value?: string | null) {
        const ymd = toDateInputValue(value);
        if (!ymd) return "—";
        const [year, month, day] = ymd.split("-");
        return `${year}/${month}/${day}`;
    }

    // Termination requests (existing users) have no attached documents — skip doc verification & Ellipse User ID.
    const isTerminationRequest = !!req?.requestType && req.requestType.toLowerCase().includes("terminate");
    const allImplFilled = implDetails.ellipseUserId && implDetails.dateAccessGranted && implDetails.implementedBy && implDetails.comments.trim() && (isTerminationRequest || mandatoryVerified) && (req?.userType !== "Contractor" || contractorDocsVerified) ;
    // HC Systems Officer must open every attached document before confirming mandatory documents are attached.
    const hasAttachments = requestDocs.length > 0;
    const allDocsViewed = isTerminationRequest || (hasAttachments && requestDocs.every(doc => viewedDocIds.includes(doc.id)));
    const canImplement = !!allImplFilled && allDocsViewed;
    const docsRemaining = requestDocs.filter(doc => !viewedDocIds.includes(doc.id));
    const role = session?.roles?.find(x => x !== null);
    const [approvers, setApprovers] = useState<RequestApproverActionDetails[] | null>(null);

    const actingRole = (role ?? "EMPLOYEE") as UserRole;

    async function runApprove() {
        if (session?.roles?.includes("TRAINING_CENTRE") && !trainingDate) {
            setTrainingDateError(true);
            return;
        }
        setApiBusy(true);
        setApiActionError(null);
        try {
            await approveRequestApi(req?.id ?? 0, actingRole, {
                trainingDate: session?.roles?.includes("TRAINING_CENTRE") ? trainingDate : undefined,
                verifiedBy: session?.displayName ?? "Training Centre",
            });
            setActionState(session?.roles?.includes("TRAINING_CENTRE") ? "verified" : "approved");
        } catch (err) {
            setApiActionError(err instanceof Error ? err.message : "Approval failed");
        } finally {
            setApiBusy(false);
        }
    }

    async function runReject(comment = rejectComment) {
        if (!comment.trim()) return;

        setApiBusy(true);
        setApiActionError(null);
        try {
            await rejectRequestApi(req?.id ?? 0, actingRole, comment.trim());
            setRejectType("close");
            setImplRejectType("close");
            setActionState("rejected");
            setImplActionState("rejected");
        } catch (err) {
            setApiActionError(err instanceof Error ? err.message : "Rejection failed");
        } finally {
            setApiBusy(false);
        }
    }

    async function runImplement() {
        if (!canImplement) return;

        const ellipseUserId = Number.parseInt(implDetails.ellipseUserId.replace(/\D/g, ""), 10);

        if (!Number.isFinite(ellipseUserId) || ellipseUserId <= 0) {
            setApiActionError("Enter a valid Ellipse User ID before implementing.");
            return;
        }

        if (!implDetails.comments.trim()) {
            setApiActionError("Implementation comments are required.");
            return;
        }

        setApiBusy(true);
        setApiActionError(null);

        try {
            await implementRequestApi(req?.id ?? 0, {
                ellipseUserId: ellipseUserId.toString(),
                dateAccessGranted: new Date(implDetails.dateAccessGranted).toISOString(),
                implementationComments: implDetails.comments.trim(),
                mandatoryInformationVerified: isTerminationRequest ? true : mandatoryVerified,
                contractorDocumentsVerified: req?.userType === "Contractor" ? contractorDocsVerified : false,
            });
            setImplActionState("implemented");
        } catch (err) {
            setApiActionError(err instanceof Error ? err.message : "Implementation failed");
        } finally {
            setApiBusy(false);
        }
    }

    async function runReturnForAmendment() {
        if (flaggedDocs.length === 0 || !reloadComment.trim()) return;

        setApiBusy(true);
        setApiActionError(null);

        try {
            await returnForAmendmentApi(req?.id ?? 0, {
                amendmentType: "Documents",
                reason: reloadComment.trim(),
                documentsRequested: flaggedDocs.join(", "),
            });
            setImplActionState("resubmit-sent");
        } catch (err) {
            setApiActionError(err instanceof Error ? err.message : "Return for amendment failed");
        } finally {
            setApiBusy(false);
        }
    }

    async function runResubmitAmendment() {
        if (!req?.id) {
            setApiActionError("This request is missing an API id and cannot be resubmitted.");
            return;
        }
        const requiredDocs = req?.userType === "Contractor"
            ? ["Contractor ID Card", "Contract Documentation"]
            : ["Employee Identity Document"];
        if (requiredDocs.some((doc) => !pendingResubFiles[doc])) {
            setApiActionError("Upload all flagged documents before submitting.");
            return;
        }
        setApiBusy(true);
        setApiActionError(null);
        try {
            const uploads = requiredDocs.map((doc) => {
                const file = pendingResubFiles[doc];
                const documentType = doc === "Contractor ID Card"
                    ? "Contractor Identification Card"
                    : doc === "Contract Documentation"
                        ? "Contract Documentation"
                        : "Identity Document";
                return {
                    documentType,
                    documentCategory: documentType,
                    file,
                };
            });
            await resubmitAmendmentApi(req?.id, uploads);
            setResubmitSent(true);
        } catch (err) {
            setApiActionError(err instanceof Error ? err.message : "Resubmit failed");
        } finally {
            setApiBusy(false);
        }
    }

    const authorisedDocRoles = ["ICT_MANAGER", "HC_SYSTEMS_OFFICER", "LINE_MANAGER"];
    const docAccessAllowed = showDocView || !!session?.roles?.some(
        r => r != null && authorisedDocRoles.includes(r)
    );
    const canArchiveDocs = role ? [...authorisedDocRoles, "SYSTEM_ADMIN"].includes(role) : false;

    const refreshRequestDocs = async () => {
        if (!req?.id) return;

        const [active, archived] = await Promise.all([
            documentsApi.getByRequest(req.id),
            canArchiveDocs
                ? documentsApi.getArchivedByRequest(req.id)
                : Promise.resolve<DocumentDetails[]>([]),
        ]);

        setRequestDocs(active ?? []);
        setArchivedDocs(archived ?? []);
    };

    useEffect(() => {
        let cancelled = false;

        setRequestDocs([]);
        setArchivedDocs([]);
        setShowArchivedDocs(false);

        if (!req?.id) {
            setRequestDocsLoading(false);
            setArchivedDocsLoading(false);
            return;
        }

        setRequestDocsLoading(true);

        documentsApi.getByRequest(req.id)
            .then(docs => {
                if (!cancelled) setRequestDocs(docs ?? []);
            })
            .catch(error => {
                if (!cancelled) {
                    setApiActionError(
                        error instanceof Error
                            ? error.message
                            : "Could not load supporting documents."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setRequestDocsLoading(false);
            });

        if (canArchiveDocs) {
            setArchivedDocsLoading(true);
            setArchivedDocsError(null);

            documentsApi.getArchivedByRequest(req.id)
                .then(docs => {
                    if (!cancelled) setArchivedDocs(docs ?? []);
                })
                .catch(error => {
                    if (!cancelled) {
                        setArchivedDocsError(
                            error instanceof Error
                                ? error.message
                                : "Could not load archived documents."
                        );
                    }
                })
                .finally(() => {
                    if (!cancelled) setArchivedDocsLoading(false);
                });
        } else {
            setArchivedDocsLoading(false);
        }

        return () => { cancelled = true; };
    }, [req, canArchiveDocs]);

    useEffect(() => {
        if (!req?.id) {
            setApprovers([]);
            return;
        }

        let cancelled = false;

        requestApprovalApi.getForRequest(req.id)
            .then(data => {
                if (!cancelled) setApprovers(data ?? []);
            })
            .catch(() => {
                if (!cancelled) setApprovers([]);
            });

        return () => { cancelled = true; };
    }, [req]);

    useEffect(() => () => revokeViewerDocument(viewingDoc), [viewingDoc]);

    const openUploadPicker = (docName: string) => {
        setUploadTargetDoc(docName);
        uploadInputRef.current?.click();
    };

    const handleUploadSelection = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadTargetDoc) return;

        setViewingDoc(fileToViewerDocument(
            `${uploadTargetDoc} (Selected for upload)`,
            file,
            session?.displayName ?? "Line Manager",
        ));
        setPendingResubFiles(prev => ({ ...prev, [uploadTargetDoc]: file }));
        setUploadedResubDocs(prev => prev.includes(uploadTargetDoc) ? prev : [...prev, uploadTargetDoc]);
        setUploadTargetDoc(null);
        event.target.value = "";
    };

    const openStoredDocument = async (doc: DocumentDetails) => {
        setLoadingDocId(doc.id);
        setApiActionError(null);

        try {
            const viewer = await loadServerViewerDocument(doc);

            setViewingDoc({
                ...viewer,
                archived: doc.archived ?? false,
                retentionExpiryDate: doc.retentionExpiryDate ?? null,
            });

            setViewedDocIds(prev =>
                prev.includes(doc.id) ? prev : [...prev, doc.id]
            );
        } catch (error) {
            setApiActionError(
                error instanceof Error
                    ? error.message
                    : "Could not open the document."
            );
        } finally {
            setLoadingDocId(null);
        }
    };

    const closeViewer = () => setViewingDoc(null);

    const handleArchiveToggle = async (doc: ViewerDocument) => {
        if (!canArchiveDocs || typeof doc.id !== "number") return;

        const id = doc.id;
        const shouldArchive = !doc.archived;

        setApiActionError(null);

        try {
            if (shouldArchive) {
                await documentsApi.archive(id);
            } else {
                await documentsApi.restore(id);
            }

            setViewingDoc(prev =>
                prev && prev.id === id
                    ? { ...prev, archived: shouldArchive }
                    : prev
            );

            setMandatoryVerified(false);
            await refreshRequestDocs();
        } catch (error) {
            setApiActionError(
                error instanceof Error
                    ? error.message
                    : "Could not update the document archive state."
            );
        }
    };

    const handleRestoreFromList = async (doc: DocumentDetails) => {
        if (!canArchiveDocs || documentActionId !== null) return;

        setDocumentActionId(doc.id);
        setApiActionError(null);

        try {
            await documentsApi.restore(doc.id);

            setViewingDoc(prev =>
                prev && prev.id === doc.id
                    ? { ...prev, archived: false }
                    : prev
            );

            setMandatoryVerified(false);
            await refreshRequestDocs();
        } catch (error) {
            setApiActionError(
                error instanceof Error
                    ? error.message
                    : "Could not restore the document."
            );
        } finally {
            setDocumentActionId(null);
        }
    };

    return (

        <div className="flex-1 flex flex-col overflow-auto bg-white">

            {apiBusy &&
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader className="animate-spin w-16 h-16 text-indigo-600" />
                        <p className="text-sm font-bold text-white">Processing…</p>
                    </div>
                </div>
            }
            {!apiBusy &&
                <>
                    <div className="p-4 border-b border-border flex items-start justify-between bg-white sticky top-0 z-10 shadow-sm">
                        <div>
                            <span className="font-mono text-xs font-bold text-accent">{req?.id}</span>
                            <h2 className="text-base font-bold text-foreground mt-0.5" style={{ fontFamily: "Barlow, sans-serif" }}>
                                {req?.requestType} — {req?.employeeName}
                            </h2>
                        </div>
                        <button onClick={onClose} className="text-foreground/40 hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {apiActionError && (
                        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                            <AlertCircle size={13} className="shrink-0 mt-0.5" />
                            <span>{apiActionError}</span>
                        </div>
                    )}

                    <div className="p-4 space-y-4 overflow-auto">
                        <input
                            ref={uploadInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp"
                            className="hidden"
                            onChange={handleUploadSelection}
                        />

                        {/* Status + tags */}
                        <div className="flex gap-2 flex-wrap">
                            <StatusBadge status={req?.status ?? ""} />
                            <EnvBadge env={req?.environment ?? ""} />
                            {req?.userType === "Contractor" && (
                                <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold">Contractor</span>
                            )}
                        </div>

                        {/* Awaiting amendment — notice for requester / Line Manager */}
                        {isAwaitingAmendment(req?.status ?? "") && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                                <div className="flex items-start gap-2">
                                    <RotateCcw size={15} className="text-purple-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-purple-800">
                                            {req?.userType === "Contractor" ? "Amendment Required — Line Manager Action" : "Document Re-submission Required"}
                                        </p>
                                        <p className="text-xs text-purple-700 mt-0.5">
                                            {req?.userType === "Contractor"
                                                ? "The HC Systems Officer has returned this contractor application for amendment. The Line Manager must respond and re-upload the flagged documents on the contractor's behalf."
                                                : "The HC Systems Officer has identified documents that require re-uploading. This request is on hold until corrected documents are submitted."}
                                        </p>
                                    </div>
                                </div>
                                {approvers?.find(a => a.approverType === "HC_SYSTEMS_OFFICER")?.rejectionReason && (
                                    <div className="bg-white border border-purple-200 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">HC Administrator Note</p>
                                        <p className="text-xs text-foreground">{approvers.find(a => a.approverType === "HC_SYSTEMS_OFFICER")?.rejectionReason}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-purple-700">
                                    <CheckCircle2 size={12} className="text-purple-500" />
                                    {req?.userType === "Contractor"
                                        ? <>The <strong>Line Manager</strong> must respond on behalf of the contractor.</>
                                        : <>The requester or Line Manager must re-upload the flagged documents.</>}
                                </div>
                                {((req?.userType === "Contractor" && role === "LINE_MANAGER") || (req?.userType !== "Contractor" && (role === "EMPLOYEE" || role === "LINE_MANAGER"))) && (
                                    <div className="border-t border-purple-200 pt-3 space-y-2">
                                        {uploadTargetDoc && (
                                            <div className="rounded-lg border border-purple-200 bg-white p-2 text-[11px] text-purple-700">
                                                <span className="font-semibold">Selected document:</span> {uploadTargetDoc}
                                            </div>
                                        )}
                                        <p className="text-xs font-bold text-purple-800">
                                            {req?.userType === "Contractor" ? "Respond — Re-upload Required Documents" : "Re-upload Required Documents"}
                                        </p>
                                        <p className="text-[11px] text-purple-600">
                                            {req?.userType === "Contractor"
                                                ? "As Line Manager you submit and amend contractor applications on their behalf. Only the documents listed below can be re-uploaded."
                                                : "Only the documents listed below can be re-uploaded. Previously accepted documents are locked."}
                                        </p>
                                        {(req?.userType === "Contractor"
                                            ? ["Contractor ID Card", "Contract Documentation"]
                                            : ["Employee Identity Document"]
                                        ).map(doc => (
                                            <div key={doc} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs
${uploadedResubDocs.includes(doc) ? "bg-emerald-50 border-emerald-200" : "bg-white border-red-200"}`}>
                                                <div className="flex items-center gap-2">
                                                    {uploadedResubDocs.includes(doc)
                                                        ? <CheckCircle2 size={12} className="text-emerald-600" />
                                                        : <AlertCircle size={12} className="text-red-500" />}
                                                    <span className={uploadedResubDocs.includes(doc) ? "text-emerald-700 font-semibold" : "text-red-700"}>{doc}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold border border-red-200">FLAGGED</span>
                                                </div>
                                                {!uploadedResubDocs.includes(doc)
                                                    ? <button onClick={() => openUploadPicker(doc)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-white rounded text-[11px] font-bold hover:opacity-90 shadow-sm"
                                                        style={{ background: "#1a2d6e" }}>
                                                        <Upload size={10} /> Upload
                                                    </button>
                                                    : <button
                                                        onClick={() => {
                                                            setUploadedResubDocs(prev => prev.filter(x => x !== doc));
                                                            setPendingResubFiles(prev => {
                                                                const next = { ...prev };
                                                                delete next[doc];
                                                                return next;
                                                            });
                                                        }}
                                                        className="text-[10px] text-foreground/40 hover:text-red-500 transition-colors px-2"
                                                    >
                                                        Remove
                                                    </button>
                                                }
                                            </div>
                                        ))}
                                        {uploadedResubDocs.length === (req?.userType === "Contractor" ? 2 : 1) && !resubmitSent && (
                                            <button
                                                disabled={apiBusy}
                                                onClick={() => void runResubmitAmendment()}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${apiBusy ? "bg-muted text-foreground/30 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700"}`}
                                            >
                                                <Check size={12} /> {apiBusy ? "Submitting…" : "Submit Re-uploaded Documents"}
                                            </button>
                                        )}
                                        {resubmitSent && (
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> Response submitted
                                                </p>
                                                <p className="text-[11px] text-emerald-700 mt-0.5">
                                                    Status will update to <strong>Pending HC Systems Officer Implementation</strong>.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                       {/* Info grid */}
<div className="grid grid-cols-2 gap-2">
    {(() => {
        const isContractor = req?.userType === "Contractor";
        const c = req?.contractor;

        return [
            ["Name", isContractor
                ? (c ? `${c.firstName ?? ""} ${c.surname ?? ""}`.trim() : req?.contractorName)
                : req?.employeeName],
            ["Service No.", req?.serviceNumber],
            ["Department", isContractor ? c?.department : req?.department],
            ["Branch", isContractor ? c?.branch : req?.branch],
            isContractor
                ? ["Company", c?.companyName ?? req?.companyName ?? "—"]
                : ["Designation", req?.designation ?? "-"],
            isContractor
                ? ["ID/Passport", c?.identificationNumber ?? "—"]
                : ["AD Username", req?.activeDirectoryUsername?.split('\\').pop() ?? "—"],
            ["Email", isContractor ? c?.emailAddress : req?.employeeEmail],
            ["Post ID", req?.temporaryPostId ?? req?.permanentPostId ?? "—"],
            ["Environment", req?.environment],
            ["Request Type", req?.requestType],
            ["Submitted", formatDateTime(req?.requestedDate)],
            ...(req?.startDate ? [["Start Date", formatDate(req?.startDate)]] : []),
            ...(req?.endDate ? [["End Date", formatDate(req?.endDate)]] : []),
            ...(isContractor && c?.responsibleManager
                ? [["Responsible Manager", c.responsibleManager]]
                : []),
            ...(isContractor && c?.businessJustification
                ? [["Business Justification", c.businessJustification]]
                : []),
        ].map(([label, value]) => (
            <div key={String(label)} className="bg-muted/60 rounded-lg p-3 border border-border">
                <div className="text-[10px] text-foreground/50 uppercase tracking-wide mb-0.5 font-semibold">{label}</div>
                <div className="text-sm text-foreground font-medium break-all">{value ?? "—"}</div>
            </div>
        ));
    })()}
</div>

                        {/* Access details */}
                        {(req?.userAccessType || req?.ellipsePosition || req?.menuAccess) && (
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b border-border">
                                    <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Access Details</span>
                                </div>
                                {([
                                    req?.userAccessType && ["User Access Type", req?.userAccessType],
                                    req?.ellipsePosition && ["Ellipse Position", req?.ellipsePosition],
                                    req?.menuAccess && ["Menu Access", req?.menuAccess],
                                    req?.requestedDate && ["Date Requested", formatRequestedDate(req.requestedDate)],
                                    req?.businessJustification && ["Justification", req?.businessJustification],
                                ].filter(Boolean) as [string, string][]).map(([l, v]) => (
                                    <div key={String(l)} className="px-3 py-2.5 border-b border-border/50 last:border-0">
                                        <div className="text-[10px] text-foreground/50 font-semibold mb-0.5">{l}</div>
                                        <div className="text-xs text-foreground">{v}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Supporting Documents */}
                        {(docAccessAllowed || canArchiveDocs) && (
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Supporting Documents</span>
                                    <div className="flex items-center gap-2">
                                        {canArchiveDocs && (
                                            <button
                                                type="button"
                                                disabled={archivedDocsLoading}
                                                aria-expanded={showArchivedDocs}
                                                onClick={() => setShowArchivedDocs(prev => !prev)}
                                                className="text-[10px] font-semibold text-accent hover:underline disabled:opacity-50"
                                            >
                                                {showArchivedDocs ? "Hide" : "Show"} archived ({archivedDocs.length})
                                            </button>
                                        )}
                                        <span className="text-[10px] text-foreground/40 flex items-center gap-1"><Shield size={9} /> Access restricted · All views logged</span>
                                    </div>
                                </div>
                                {requestDocsLoading ? (
                                    <div className="px-3 py-3 text-[11px] text-foreground/40">Loading documents…</div>
                                ) : requestDocs.length === 0 ? (
                                    <div className="px-3 py-3 text-[11px] text-foreground/40 flex items-center gap-1.5">
                                        <AlertCircle size={11} className="shrink-0" /> No documents uploaded for this request.
                                    </div>
                                ) : (
                                    requestDocs && requestDocs.map((doc) => (
                                        <div key={doc.id} className="px-3 py-2.5 flex items-center justify-between gap-3 border-b border-border/50 last:border-0">
                                            <div className="min-w-0">
                                                <p className="text-xs text-foreground truncate">{doc.documentType || "Supporting document"}</p>
                                                <p className="text-[10px] text-foreground/50 font-mono truncate" title={doc.fileName ?? undefined}>
                                                    {doc.fileName || `Document-${doc.id}`} · {formatBytes(doc.contentLength)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold"><Check size={10} /> Uploaded</span>
                                                <button
                                                    type="button"
                                                    disabled={loadingDocId === doc.id || documentActionId !== null}
                                                    onClick={() => void openStoredDocument(doc)}
                                                    className="flex items-center gap-1 text-[10px] px-2 py-1 bg-muted rounded-lg text-foreground/60 hover:text-foreground transition-colors border border-border disabled:opacity-50"
                                                >
                                                    <Eye size={10} /> {loadingDocId === doc.id ? "Opening…" : "View"}
                                                </button>
                                                {canArchiveDocs && (
                                                    <button
                                                        type="button"
                                                        data-document-action="archive"
                                                        disabled={documentActionId !== null || loadingDocId !== null}
                                                        onClick={() => {
                                                            if (documentActionId !== null) return;
                                                            setDocumentActionId(doc.id);

                                                            void handleArchiveToggle({
                                                                id: doc.id,
                                                                name: doc.documentType || "Supporting document",
                                                                fileName: doc.fileName || ("Document-" + doc.id),
                                                                archived: false,
                                                            })
                                                                .catch(error => setApiActionError(
                                                                    error instanceof Error
                                                                        ? error.message
                                                                        : "Could not archive the document."
                                                                ))
                                                                .finally(() => setDocumentActionId(null));
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] px-2 py-1 bg-amber-50 rounded-lg text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
                                                    >
                                                        {documentActionId === doc.id ? "Archiving..." : "Archive"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {canArchiveDocs && showArchivedDocs && (
                                    <div className="border-t border-border bg-amber-50/40">
                                        <div className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                            Archived Documents
                                        </div>

                                        {archivedDocsError && (
                                            <div className="px-3 py-2 text-[11px] text-red-600 bg-red-50 border-b border-red-200">
                                                {archivedDocsError}
                                            </div>
                                        )}

                                        {archivedDocsLoading ? (
                                            <div className="px-3 py-3 text-[11px] text-foreground/40">
                                                Loading archived documents...
                                            </div>
                                        ) : archivedDocs.length === 0 ? (
                                            <div className="px-3 py-3 text-[11px] text-foreground/40">
                                                No archived documents.
                                            </div>
                                        ) : (
                                            archivedDocs.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className="px-3 py-2.5 flex items-center justify-between gap-3 border-b border-border/50 last:border-0"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-foreground truncate">
                                                            {doc.documentType || "Supporting document"}
                                                        </p>
                                                        <p
                                                            className="text-[10px] text-foreground/50 font-mono truncate"
                                                            title={doc.fileName ?? undefined}
                                                        >
                                                            {doc.fileName || ("Document-" + doc.id)} · {formatBytes(doc.contentLength)}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={documentActionId !== null}
                                                        onClick={() => void handleRestoreFromList(doc)}
                                                        className="flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-50 rounded-lg text-emerald-700 hover:opacity-90 border border-emerald-200 disabled:opacity-50"
                                                    >
                                                        {documentActionId === doc.id ? "Restoring..." : "Restore"}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {viewingDoc && (
                            <DocumentViewerModal
                                document={viewingDoc}
                                requestId={req?.id}
                                viewerName={session?.displayName ?? "Authorised User"}
                                viewerRole={role && role in ROLE_LABELS ? ROLE_LABELS[role as UserRole] : role}
                                accessLog={docAccessLog}
                                canArchive={canArchiveDocs}
                                onClose={closeViewer}
                                onAccessLogged={(entry) => setDocAccessLog(prev => [entry, ...prev])}
                                onArchiveToggle={handleArchiveToggle}
                            />
                        )}

                        {/* Workflow audit trail */}
                        <div>
                            <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Zap size={12} className="text-accent" /> Workflow Audit Trail
                            </h4>
                            <WorkflowSteps approvers={approvers} req={req} />
                            <WorkflowAuditRows approvers={approvers} req={req} />
                        </div>

                        {/* Training Centre verification */}
                        {session?.roles?.includes("TRAINING_CENTRE") && req?.status === "Training Verification Pending" && (() => {
                            const tcNext = getNextWorkflowStep(req, "training-verify");
                            const maxDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate() - 1).padStart(2, "0")}`;

                            return (
                                <div className="space-y-2 pt-1">
                                    {actionState === "verified" && !confirmDismissed && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDismissed(true)}>
                                            <div className="bg-white rounded-2xl shadow-2xl border border-teal-200 p-6 max-w-sm w-full mx-4 space-y-3" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-teal-800">Verification Successful</p>
                                                        <p className="text-xs text-teal-700 mt-0.5">Training verified on {trainingDate}. Forwarded for implementation.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-1 border-t border-teal-200">
                                                    <span className="text-[11px] text-teal-700 font-semibold">New Status:</span>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${tcNext.statusCls}`}>{tcNext.statusLabel}</span>
                                                </div>
                                                <button type="button" onClick={() => { setConfirmDismissed(true); onClose(); }} className="w-full py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors">Done</button>
                                            </div>
                                        </div>
                                    )}

                                    {actionState === "idle" && !rejectMode && (
                                        <>
                                            <div className={`p-3 rounded-lg border space-y-2 ${trainingDateError ? "bg-red-50 border-red-200" : "bg-teal-50 border-teal-200"}`}>
                                                <label className="block text-xs font-bold text-teal-800 flex items-center gap-1.5">
                                                    <CalendarRange size={12} /> Date Training Was Completed <span className="text-red-500">*</span>
                                                </label>
                                                <input type="date" value={trainingDate} max={maxDate} onChange={e => { setTrainingDate(e.target.value); setTrainingDateError(false); }} className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400 ${trainingDateError ? "border-red-400" : "border-teal-200"}`} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button disabled={apiBusy || !trainingDate} onClick={() => { if (!trainingDate) { setTrainingDateError(true); return; } void runApprove(); }} className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50">
                                                    <Check size={13} /> Training Verified
                                                </button>
                                                <button onClick={() => setRejectMode(true)} className="flex-1 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                                                    <X size={13} /> Reject
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {/* HC Admin Implementation */}
                        {session?.roles?.includes("HC_SYSTEMS_OFFICER") && (req?.status === "Hc Systems Officer Implementation Pending") && (
                            <div className="space-y-3 pt-1">
                                {implActionState === "implemented" && !confirmDismissed && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDismissed(true)}>
                                        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-6 max-w-sm w-full mx-4 space-y-3" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-800">Access Implemented Successfully</p>
                                                    <p className="text-xs text-emerald-700 mt-0.5">Ellipse access has been granted.</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => { setConfirmDismissed(true); onClose(); }} className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors">Done</button>
                                        </div>
                                    </div>
                                )}

                                {implActionState === "idle" && !implRejectMode && (
                                    <>
                                        <div className="border border-sky-200 rounded-xl overflow-hidden">
                                            <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-200">
                                                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Implementation Details</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">Ellipse User ID <span className="text-red-500">*</span></label>
                                                        <input type="text" placeholder="e.g. EU-2890" value={implDetails.ellipseUserId} onChange={e => setImplDetails(p => ({ ...p, ellipseUserId: e.target.value }))} className="w-full px-2.5 py-2 bg-white border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">Date Access Granted <span className="text-red-500">*</span></label>
                                                        <input type="date" value={implDetails.dateAccessGranted} onChange={e => setImplDetails(p => ({ ...p, dateAccessGranted: e.target.value }))} className="w-full px-2.5 py-2 bg-white border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">Implemented By <span className="text-red-500">*</span></label>
                                                        <input type="text" value={implDetails.implementedBy} readOnly className="w-full px-2.5 py-2 bg-sky-50/60 border border-border rounded-lg text-xs text-foreground/70 cursor-default" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">Implementation Comments <span className="text-red-500">*</span></label>
                                                        <textarea rows={2} placeholder="Notes..." value={implDetails.comments} onChange={e => setImplDetails(p => ({ ...p, comments: e.target.value }))} className="w-full px-2.5 py-2 bg-white border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
                                                    </div>
                                                    {!isTerminationRequest && (
                                                        <label className={`col-span-2 flex items-start gap-2 text-xs ${allDocsViewed ? "text-foreground/70" : "text-foreground/40 cursor-not-allowed"}`}>
                                                            <input type="checkbox" checked={mandatoryVerified} disabled={!allDocsViewed} onChange={e => setMandatoryVerified(e.target.checked)} className="mt-0.5" />
                                                            <span>Mandatory information verified against the request and supporting documents.{!allDocsViewed && hasAttachments && <span className="text-[10px] font-bold text-amber-600"> — View all attached documents first ({docsRemaining.length} remaining)</span>}</span>
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button disabled={apiBusy || !canImplement} onClick={() => { if (canImplement) void runImplement(); }} className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition-colors disabled:opacity-50">
                                                <Check size={13} /> Implement Access
                                            </button>
                                            <button onClick={() => setImplRejectMode(true)} className="flex-1 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                                                <X size={13} /> Reject
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </>}
        </div>
    );
}




