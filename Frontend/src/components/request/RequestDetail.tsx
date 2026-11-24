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

export function RequestDetail({ req: incomingReq, onClose, onReload }: { req: RequestDetails | null; onClose: () => void; onReload: () => void }) {
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
    const [rejectType, setRejectType] = useState<"send-back" | "close" | null>(null);
    const [apiBusy, setApiBusy] = useState(false);
    const [apiActionError, setApiActionError] = useState<string | null>(null);
    const [ellipseIdError, setEllipseIdError] = useState<string | null>(null);
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
    const [implRejectType, setImplRejectType] = useState<"send-back" | "close" | null>(null);
    const [viewingDoc, setViewingDoc] = useState<ViewerDocument | null>(null);
    const [loadingDocId, setLoadingDocId] = useState<number | null>(null);
    const [uploadTargetDoc, setUploadTargetDoc] = useState<string | null>(null);
    const [docAccessLog, setDocAccessLog] = useState<DocumentAccessLogEntry[]>(INITIAL_DOC_ACCESS_LOG);
    const [requestDocs, setRequestDocs] = useState<DocumentDetails[]>([]);
    const [requestDocsLoading, setRequestDocsLoading] = useState(false);
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

    const requestedDateValue = toDateInputValue(req?.requestedDate);


    // Termination requests (existing users) have no attached documents — skip doc verification & Ellipse User ID.
    const isTerminationRequest = !!req?.requestType && req.requestType.toLowerCase().includes("terminate");
    const allImplFilled = implDetails.ellipseUserId && implDetails.dateAccessGranted && implDetails.implementedBy && implDetails.comments.trim() && (isTerminationRequest || mandatoryVerified) && (req?.userType !== "Contractor" || contractorDocsVerified);
    // HC Systems Officer must open every attached document before confirming mandatory documents are attached.
    const hasAttachments = requestDocs.length > 0;
    const allDocsViewed = isTerminationRequest || (hasAttachments && requestDocs.every(doc => viewedDocIds.includes(doc.id)));
    const canImplement = !!allImplFilled && allDocsViewed;
    const docsRemaining = requestDocs.filter(doc => !viewedDocIds.includes(doc.id));
    const role = session?.roles?.find(x => x !== null);
    const [approvers, setApprovers] = useState<RequestApproverActionDetails[] | null>(null);

    // const requestNumericId = parseNumericRequestId(req);
    const actingRole = (role ?? "EMPLOYEE") as UserRole;

    async function runApprove() {
        if (session?.roles?.includes("TRAINING_CENTRE")) {
            if (!trainingDate) {
                setTrainingDateError(true);
                return;
            }
            // Training date must be today or earlier — no future dates.
            if (trainingDate > getMaxTrainingDate()) {
                setTrainingDateError(true);
                return;
            }
        }
        setApiBusy(true);
        setApiActionError(null);
        try {
            await approveRequestApi(req?.id ?? 0, actingRole, {
                trainingDate: session?.roles?.includes("TRAINING_CENTRE") ? trainingDate : undefined,
                verifiedBy: session?.adUsername ?? "Training Centre",
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
            // Reject / cancel always closes the request — remaining stages must not stay waiting.
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

        // Ellipse User ID is captured for all implementations — for terminations it confirms the correct person was terminated.
        const ellipseUserId = Number.parseInt(implDetails.ellipseUserId.replace(/\D/g, ""), 10);

        if (!Number.isFinite(ellipseUserId) || ellipseUserId <= 0) {
            setEllipseIdError("Enter a valid Ellipse User ID before implementing.");
            return;
        }

        if (!implDetails.comments.trim()) {
            setApiActionError("Implementation comments are required.");
            return;
        }

        setApiBusy(true);
        setApiActionError(null);
        setEllipseIdError(null);

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

        if (req?.documentResubmissionRequests?.some((doc) => !pendingResubFiles[doc])) {
            setApiActionError("Upload all flagged documents before submitting.");
            return;
        }

        setApiBusy(true);
        setApiActionError(null);

        try {
            const uploads = req?.documentResubmissionRequests ? req?.documentResubmissionRequests?.map((doc) => {
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
            }) : [];

            await resubmitAmendmentApi(req?.id, uploads);
            setResubmitSent(true);
        } catch (err) {
            setApiActionError(err instanceof Error ? err.message : "Resubmit failed");
        } finally {
            setApiBusy(false);
        }
    }

    const authorisedDocRoles = ["ICT_MANAGER", "HC_SYSTEMS_OFFICER", "LINE_MANAGER"];
    const docAccessAllowed = role ? authorisedDocRoles.includes(role) : showDocView;

    useEffect(() => {
        if (!req?.id) {
            setRequestDocs([]);
            return;
        }
        let cancelled = false;
        setRequestDocsLoading(true);
        documentsApi.getByRequest(req.id)
            .then(docs => { if (!cancelled) setRequestDocs(docs ?? []); })
            .catch(() => { if (!cancelled) setRequestDocs([]); })
            .finally(() => { if (!cancelled) setRequestDocsLoading(false); });
        return () => { cancelled = true; };
    }, [req]);

    // Reset viewed-document tracking whenever a different request is opened.
    useEffect(() => {
        setViewedDocIds([]);
        setMandatoryVerified(false);
    }, [req?.id]);

    function loadApprovers() {
        useEffect(() => {
            if (!req?.id) {
                setApprovers([]);
                return;
            }
            let cancelled = false;
            setRequestDocsLoading(true);
            requestApprovalApi.getForRequest(req.id)
                .then(data => { if (!cancelled) setApprovers(data ?? []); })
                .catch(() => { if (!cancelled) setApprovers([]); })
                .finally(() => { if (!cancelled) setRequestDocsLoading(false); });
            return () => { cancelled = true; };
        }, [req]);
    }

    loadApprovers();

    // Releases the object URL of the document being replaced, and on unmount.
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
        setViewedDocIds(prev => prev.includes(doc.id) ? prev : [...prev, doc.id]);
        try {
            setViewingDoc(await loadServerViewerDocument(doc));
        } finally {
            setLoadingDocId(null);
        }
    };

    const closeViewer = () => setViewingDoc(null);


    // Calculate yesterday's date for max constraint
    function getMaxTrainingDate() {
        const today = new Date();
        
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
                                {/* HC admin comment shown to all parties */}
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
                                {/* Targeted re-upload — LM responds for contractors; employee for staff requests */}
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
                                        {req?.documentResubmissionRequests?.map(doc => (
                                            <div key={doc} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs
${uploadedResubDocs.includes(doc) ? "bg-emerald-50 border-emerald-200" : "bg-white border-red-200"}`}>
                                                <div className="flex items-center gap-2">
                                                    {uploadedResubDocs.includes(doc)
                                                        ? <CheckCircle2 size={12} className="text-emerald-600" />
                                                        : <AlertCircle size={12} className="text-red-500" />}
                                                    <span className={uploadedResubDocs.includes(doc) ? "text-emerald-700 font-semibold" : "text-red-700"}>{doc}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold border border-red-200">FLAGGED</span>
                                                </div>
                                                {!uploadedResubDocs.includes(doc) &&
                                                    <button onClick={() => openUploadPicker(doc)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-white rounded text-[11px] font-bold hover:opacity-90 shadow-sm"
                                                        style={{ background: "#1a2d6e" }}>
                                                        <Upload size={10} /> Upload
                                                    </button>
                                                }
                                            </div>
                                        ))}
                                        {uploadedResubDocs.length === req?.documentResubmissionRequests?.length && !resubmitSent && (
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

                        {/* Supporting Documents — restricted to authorised roles + audit log */}
                        {(req?.userType === "Contractor" || docAccessAllowed) && (
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Supporting Documents</span>
                                    <span className="text-[10px] text-foreground/40 flex items-center gap-1"><Shield size={9} /> Access restricted · All views logged</span>
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
                                                    disabled={loadingDocId === doc.id}
                                                    onClick={() => void openStoredDocument(doc)}
                                                    className="flex items-center gap-1 text-[10px] px-2 py-1 bg-muted rounded-lg text-foreground/60 hover:text-foreground transition-colors border border-border disabled:opacity-50"
                                                >
                                                    <Eye size={10} /> {loadingDocId === doc.id ? "Opening…" : "View"}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {/* Document access log */}
                                {/* to do - part of phase 2 */}
                                {/* {docAccessAllowed && (
                                    <div className="px-3 py-2 bg-slate-50 border-t border-border">
                                        <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Document Access Log</p>
                                        {docAccessLog.slice(0, 4).map((entry, i) => (
                                            <div key={i} className="flex gap-3 text-[10px] text-foreground/50 py-0.5">
                                                <span className="font-semibold text-foreground/70 shrink-0">{entry.actorName}</span>
                                                <span>{entry.action}</span>
                                                <span>{entry.at}</span>
                                            </div>
                                        ))}
                                    </div>
                                )} */}
                            </div>
                        )}

                        {viewingDoc && (
                            <DocumentViewerModal
                                document={viewingDoc}
                                requestId={req?.id}
                                viewerName={session?.displayName ?? "Authorised User"}
                                viewerRole={role && role in ROLE_LABELS ? ROLE_LABELS[role as UserRole] : role}
                                accessLog={docAccessLog}
                                onClose={closeViewer}
                                onAccessLogged={(entry) => setDocAccessLog(prev => [entry, ...prev])}
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

                        {/* ── Training Centre: Verify / Reject with workflow confirmations ── */}
                        {session?.roles?.includes("TRAINING_CENTRE") && req?.status === "Training Verification Pending" && (() => {
                            const tcNext = getNextWorkflowStep(req, "training-verify");


                            return (
                                <div className="space-y-2 pt-1">
                                    {/* Verified confirmation — centered pop-up */}
                                    {actionState === "verified" && !confirmDismissed && (
                                        <div
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                            onClick={() => setConfirmDismissed(true)}
                                        >
                                            <div
                                                className="bg-white rounded-2xl shadow-2xl border border-teal-200 p-6 max-w-sm w-full mx-4 space-y-3"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-teal-800">Verification Successful</p>
                                                        <p className="text-xs text-teal-700 mt-0.5">
                                                            Training verified on {trainingDate}. The request has been forwarded to the HC Systems Officer for implementation.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-1 border-t border-teal-200">
                                                    <span className="text-[11px] text-teal-700 font-semibold">New Status:</span>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${tcNext.statusCls}`}>
                                                        {tcNext.statusLabel}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-teal-600">Action recorded in request history · {new Date().toLocaleDateString("en-ZA")} {new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => { setConfirmDismissed(true); onClose(); }}
                                                    className="w-full py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejected by TC confirmation — centered pop-up */}
                                    {actionState === "rejected" && !confirmDismissed && (
                                        <div
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                            onClick={() => setConfirmDismissed(true)}
                                        >
                                            <div
                                                className="bg-white rounded-2xl shadow-2xl border border-red-200 p-6 max-w-sm w-full mx-4 space-y-3"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <XCircle size={18} className="text-red-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-red-700">Request Rejected &amp; Closed</p>
                                                        <p className="text-xs text-red-600 mt-0.5">
                                                            The request has been permanently closed. Remaining workflow stages are terminated.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-1 border-t border-red-200 flex-wrap gap-y-1">
                                                    <span className="text-[11px] text-red-700 font-semibold">New Status:</span>
                                                    <span className="text-[11px] px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full font-bold">Rejected by Training Centre</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-red-200 text-red-800 border-red-300">
                                                        Closed
                                                    </span>
                                                </div>
                                                {rejectComment && (
                                                    <div className="bg-white border border-red-200 rounded-lg p-2">
                                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">Reason for Rejection</p>
                                                        <p className="text-xs text-foreground">{rejectComment}</p>
                                                    </div>
                                                )}
                                                <p className="text-[11px] text-red-500">Action recorded in request history · Employee has been notified.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => { setConfirmDismissed(true); onClose(); }}
                                                    className="w-full py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* TC reject options */}
                                    {rejectMode && actionState === "idle" && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                            <p className="text-xs font-bold text-red-800">Reject &amp; Close Request</p>
                                            <p className="text-[11px] text-red-700">This permanently closes the request. Later stages will not remain waiting.</p>
                                            <label className="block text-xs font-bold text-red-800">
                                                Reason for Rejection <span className="text-red-500">*</span>
                                            </label>
                                            <textarea rows={3} value={rejectComment} onChange={e => setRejectComment(e.target.value)}
                                                placeholder="State the reason for permanently closing this request..."
                                                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={apiBusy || !rejectComment.trim()}
                                                    onClick={() => { if (rejectComment.trim()) void runReject(); }}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${apiBusy || !rejectComment.trim() ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 shadow-sm"}`}>
                                                    <X size={12} /> Confirm Reject &amp; Close
                                                </button>
                                                <button onClick={() => { setRejectMode(false); setRejectComment(""); setRejectType(null); }}
                                                    className="px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold text-foreground/60 hover:bg-muted transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Training date + action buttons */}
                                    {actionState === "idle" && !rejectMode && (
                                        <>
                                            <div className={`p-3 rounded-lg border space-y-2 ${trainingDateError ? "bg-red-50 border-red-200" : "bg-teal-50 border-teal-200"}`}>
                                                <label className="block text-xs font-bold text-teal-800 flex items-center gap-1.5">
                                                    <CalendarRange size={12} /> Date Training Was Completed <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={trainingDate}
                                                    max={getMaxTrainingDate()}
                                                    onChange={e => { setTrainingDate(e.target.value); setTrainingDateError(false); }}
                                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400 ${trainingDateError ? "border-red-400" : "border-teal-200"}`}
                                                />
                                                {trainingDateError && (
                                                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                                                        <AlertCircle size={10} /> Training date is required and cannot be in the future.
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-teal-700">
                                                    Record the date the user completed Ellipse training. <strong>Must be today or earlier.</strong>
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={apiBusy || !trainingDate}
                                                    onClick={() => {
                                                        if (!trainingDate) { setTrainingDateError(true); return; }
                                                        void runApprove();
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
${apiBusy || !trainingDate ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"}`}>
                                                    <Check size={13} /> {apiBusy ? "Submitting…" : "Training Verified"}
                                                </button>
                                                <button
                                                    onClick={() => setRejectMode(true)}
                                                    className="flex-1 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                                                    <X size={13} /> Reject
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── HC Admin: Implement Access ── */}
                        {session?.roles?.includes("HC_SYSTEMS_OFFICER") && (req?.status === "Hc Systems Officer Implementation Pending") && (
                            <div className="space-y-3 pt-1">

                                {/* ── Implemented confirmation — centered pop-up ── */}
                                {implActionState === "implemented" && !confirmDismissed && (
                                    <div
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                        onClick={() => setConfirmDismissed(true)}
                                    >
                                        <div
                                            className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-6 max-w-sm w-full mx-4 space-y-3"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-800">Access Implemented Successfully</p>
                                                    <p className="text-xs text-emerald-700 mt-0.5">Ellipse access has been granted. The request has been moved to Completed History.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 text-[11px]">
                                                <div><span className="font-semibold text-emerald-700">Ellipse User ID:</span> <span className="font-mono text-emerald-800">{implDetails.ellipseUserId}</span></div>
                                                <div><span className="font-semibold text-emerald-700">Date Granted:</span> <span className="text-emerald-800">{implDetails.dateAccessGranted}</span></div>
                                                <div className="col-span-2"><span className="font-semibold text-emerald-700">Implemented By:</span> <span className="text-emerald-800">{implDetails.implementedBy}</span></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-emerald-700 font-semibold">New Status:</span>
                                                <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full font-bold">Access Implemented</span>
                                            </div>
                                            <p className="text-[11px] text-emerald-600">Implementation recorded in request timeline · {new Date().toLocaleDateString("en-ZA")} {new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</p>
                                            <button
                                                type="button"
                                                onClick={() => { setConfirmDismissed(true); onClose(); }}
                                                className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Rejected by HC confirmation — centered pop-up ── */}
                                {implActionState === "rejected" && !confirmDismissed && (
                                    <div
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                        onClick={() => setConfirmDismissed(true)}
                                    >
                                        <div
                                            className="bg-white rounded-2xl shadow-2xl border border-red-200 p-6 max-w-sm w-full mx-4 space-y-3"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <XCircle size={18} className="text-red-600 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-700">Request Rejected &amp; Closed</p>
                                                    <p className="text-xs text-red-600 mt-0.5">
                                                        The request has been permanently closed. Remaining workflow stages are terminated.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1 border-t border-red-200 flex-wrap gap-y-1">
                                                <span className="text-[11px] text-red-700 font-semibold">New Status:</span>
                                                <span className="text-[11px] px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full font-bold">Rejected by HC Systems Officer</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-red-200 text-red-800 border-red-300">
                                                    Closed
                                                </span>
                                            </div>
                                            {implRejectComment && (
                                                <div className="bg-white border border-red-200 rounded-lg p-2">
                                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">Reason for Rejection</p>
                                                    <p className="text-xs text-foreground">{implRejectComment}</p>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-red-500">Action recorded in request history · Employee notified.</p>
                                            <button
                                                type="button"
                                                onClick={() => { setConfirmDismissed(true); onClose(); }}
                                                className="w-full py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Document resubmission sent confirmation ── */}
                                {implActionState === "resubmit-sent" && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                        <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 p-6 max-w-sm w-full mx-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                    <RotateCcw size={20} className="text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-orange-800">Returned for Amendment</p>
                                                    <p className="text-xs text-orange-700 mt-0.5">The employee has been notified to resubmit the selected documents.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1 border-t border-orange-200">
                                                <span className="text-[11px] text-orange-700 font-semibold">New Status:</span>
                                                <span className="text-[11px] px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full font-bold">Awaiting Information</span>
                                            </div>
                                            {flaggedDocs.length > 0 && (
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-1">
                                                    <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Documents Required for Resubmission</p>
                                                    {flaggedDocs.map(d => <p key={d} className="text-xs text-foreground flex items-center gap-1"><AlertCircle size={10} className="text-orange-500" /> {d}</p>)}
                                                </div>
                                            )}
                                            {reloadComment && (
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                                    <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide mb-1">Administrator Comments</p>
                                                    <p className="text-xs text-foreground">{reloadComment}</p>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-orange-600">Once the employee resubmits, the request status will update to <strong>Pending HC Systems Officer Review</strong>.</p>
                                            <button
                                                type="button"
                                                onClick={() => { setImplActionState("idle"); onClose(); }}
                                                className="w-full py-2 rounded-lg text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-sm transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── HC Reject options ── */}
                                {implRejectMode && implActionState === "idle" && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-red-800">Reject &amp; Close Request</p>
                                        <p className="text-[11px] text-red-700">This permanently closes the request. Use Return for Amendment if documents must be corrected instead.</p>
                                        <label className="block text-xs font-bold text-red-800">Reason for Rejection <span className="text-red-500">*</span></label>
                                        <textarea rows={3} value={implRejectComment} onChange={e => setImplRejectComment(e.target.value)}
                                            placeholder="State the reason for permanently closing this request..."
                                            className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                                        <div className="flex gap-2">
                                            <button disabled={apiBusy || !implRejectComment.trim()}
                                                onClick={() => { if (implRejectComment.trim()) void runReject(implRejectComment); }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${apiBusy || !implRejectComment.trim() ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 shadow-sm"}`}>
                                                <X size={12} /> Confirm Reject &amp; Close
                                            </button>
                                            <button onClick={() => { setImplRejectMode(false); setImplRejectComment(""); setImplRejectType(null); }}
                                                className="px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold text-foreground/60 hover:bg-muted transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Implementation form — shown when idle ── */}
                                {implActionState === "idle" && !implRejectMode && (
                                    <>
                                        <div className="border border-sky-200 rounded-xl overflow-hidden">
                                            <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-200">
                                                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Implementation Details</span>
                                                <p className="text-[11px] text-sky-600 mt-0.5">Complete all mandatory fields before implementing.</p>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">
                                                            {isTerminationRequest ? "Ellipse User ID (person terminated)" : "Ellipse User ID"} <span className="text-red-500">*</span>
                                                        </label>
                                                        <input type="text" placeholder="e.g. EU-2890"
                                                            value={implDetails.ellipseUserId}
                                                            onChange={e => setImplDetails(p => ({ ...p, ellipseUserId: e.target.value }))}
                                                            className="w-full px-2.5 py-2 bg-white border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                                        {ellipseIdError && (
                                                            <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                                                                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                                                <span>{ellipseIdError}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">
                                                            {isTerminationRequest ? "Termination Granted" : "Date Access Granted"} <span className="text-red-500">*</span>
                                                        </label>
                                                        <input type="date"
                                                            max={getMaxTrainingDate()}
                                                            value={implDetails.dateAccessGranted}
                                                            onChange={e => setImplDetails(p => ({ ...p, dateAccessGranted: e.target.value }))}
                                                            className="w-full px-2.5 py-2 bg-white border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">Implemented By <span className="text-red-500">*</span></label>
                                                        <input type="text" value={implDetails.implementedBy} readOnly
                                                            className="w-full px-2.5 py-2 bg-sky-50/60 border border-border rounded-lg text-xs text-foreground/70 cursor-default" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-foreground/60 mb-1">Implementation Comments <span className="text-red-500">*</span></label>
                                                        <textarea rows={2} placeholder="Notes on implementation, exceptions, or observations..."
                                                            value={implDetails.comments}
                                                            onChange={e => setImplDetails(p => ({ ...p, comments: e.target.value }))}
                                                            className="w-full px-2.5 py-2 bg-white border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
                                                    </div>
                                                    {!isTerminationRequest && (
                                                        <label className={`col-span-2 flex items-start gap-2 text-xs ${allDocsViewed ? "text-foreground/70" : "text-foreground/40 cursor-not-allowed"}`}>
                                                            <input type="checkbox" checked={mandatoryVerified} disabled={!allDocsViewed} onChange={e => setMandatoryVerified(e.target.checked)} className="mt-0.5" />
                                                            <span>Mandatory information verified against the request and supporting documents.{!allDocsViewed && hasAttachments && <span className="text-[10px] font-bold text-amber-600"> — View all attached documents first ({docsRemaining.length} remaining)</span>}</span>
                                                        </label>
                                                    )}
                                                    {!isTerminationRequest && !hasAttachments && !requestDocsLoading && (
                                                        <p className="col-span-2 text-[11px] text-red-600 flex items-center gap-1.5"><AlertCircle size={11} /> No documents are attached to this request — the requester must upload the mandatory documents before implementation can proceed.</p>
                                                    )}
                                                    {req?.userType === "Contractor" && (
                                                        <label className="col-span-2 flex items-start gap-2 text-xs text-foreground/70">
                                                            <input type="checkbox" checked={contractorDocsVerified} onChange={e => setContractorDocsVerified(e.target.checked)} className="mt-0.5" />
                                                            <span>Contractor documents verified (ID / contractor card / contract).</span>
                                                        </label>
                                                    )}
                                                </div>
                                                {!canImplement && (
                                                    <p className="text-[11px] text-amber-600 flex items-center gap-1.5"><AlertCircle size={11} /> {!hasAttachments && !isTerminationRequest ? "No documents attached — cannot implement until mandatory documents are uploaded." : !allDocsViewed ? `View all attached documents (${docsRemaining.length} remaining) and complete all mandatory fields before implementing.` : "Complete all mandatory fields and verification checks before implementing."}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <button disabled={apiBusy || !canImplement}
                                                onClick={() => { if (canImplement) void runImplement(); }}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
${apiBusy || !canImplement ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"}`}>
                                                <Check size={13} /> {apiBusy ? "Submitting…" : isTerminationRequest ? "Implement Termination" : "Implement Access"}
                                            </button>
                                            <button onClick={() => setImplRejectMode(true)}
                                                className="flex-1 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                                                <X size={13} /> Reject
                                            </button>
                                        </div>

                                        {/* Return for Amendment */}
                                        {showReload && !req.requestType.toLowerCase().includes("terminate") && (
                                            <div>
                                                <button onClick={() => setShowReloadBox(v => !v)}
                                                    className="w-full py-2 bg-amber-50 text-amber-700 border border-amber-300 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5">
                                                    <RotateCcw size={13} /> Return for Amendment
                                                </button>
                                                {showReloadBox && (
                                                    <div className="mt-2 space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                        <div className="text-xs text-amber-800 space-y-1">
                                                            <p className="font-bold">Return for Amendment Process</p>
                                                            <p>• Status will change to <strong>Awaiting Information</strong></p>
                                                            {req?.userType === "Contractor" ? (
                                                                <>
                                                                    <p>• The <strong>Line Manager</strong> will be notified (contractors do not respond themselves)</p>
                                                                    <p>• Line Manager may only upload the flagged documents on the contractor's behalf</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p>• Employee will be notified with selected documents and comments</p>
                                                                    <p>• Employee may only upload the flagged documents</p>
                                                                </>
                                                            )}
                                                            <p>• Once resubmitted, status updates to <strong>Pending HC Systems Officer Review</strong></p>
                                                        </div>
                                                        <label className="block text-xs font-bold text-amber-800">
                                                            Select documents requiring amendment <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="space-y-1.5">
                                                            <label key={"Identity Document / Passport"} className="flex items-center gap-2 cursor-pointer text-xs text-amber-800">
                                                                <input type="checkbox" checked={flaggedDocs.includes("Identity Document / Passport")} onChange={() => toggleFlaggedDoc("Identity Document / Passport")} className="rounded accent-amber-600" /> {"Identity Document / Passport"}
                                                            </label>
                                                            {req.userType == "Contractor" && ["Contractor ID Card", "Contract Documentation"].map(doc => (
                                                                <label key={doc} className="flex items-center gap-2 cursor-pointer text-xs text-amber-800">
                                                                    <input type="checkbox" checked={flaggedDocs.includes(doc)} onChange={() => toggleFlaggedDoc(doc)} className="rounded accent-amber-600" /> {doc}
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <label className="block text-xs font-bold text-amber-800">Comments / Instructions <span className="text-red-500">*</span></label>
                                                        <textarea rows={3} value={reloadComment} onChange={e => setReloadComment(e.target.value)}
                                                            placeholder="Explain what needs to be corrected or what valid documents are required..."
                                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                                                        <button
                                                            onClick={() => { if (flaggedDocs.length > 0 && reloadComment.trim()) void runReturnForAmendment(); }}
                                                            disabled={apiBusy || flaggedDocs.length === 0 || !reloadComment.trim()}
                                                            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
${apiBusy || flaggedDocs.length === 0 || !reloadComment.trim() ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-amber-600 text-white hover:bg-amber-700 shadow-sm"}`}>
                                                            <MessageSquare size={12} /> {apiBusy ? "Submitting…" : "Confirm Return for Amendment"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── Shared reusable approve/reject confirmation UI ── */}
                        {(() => {
                            const showBlock = showApprove
                                && ((session?.roles?.includes("LINE_MANAGER") && req?.status === "Awaiting Line Manager Approval") || (session?.roles?.includes("ICT_MANAGER") && req?.status === "ICT Manager Approval Pending"));
                            if (!showBlock) return null;

                            // Role + environment-specific next step
                            const nextStep = getNextWorkflowStep(
                                req,
                                session?.roles?.includes("ICT_MANAGER") ? "ict-approve" : "line-manager-approve",
                            );
                            const approveSuccess = "Approved Successfully";
                            const approveForward = nextStep.forwardMessage;
                            const nextStatusLabel = nextStep.statusLabel;
                            const nextStatusCls = nextStep.statusCls;
                            const rejectedByLabel = session?.roles?.includes("ICT_MANAGER") ? "Rejected by ICT Manager" : "Rejected by Line Manager";

                            const ts = `${new Date().toLocaleDateString("en-ZA")} ${new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`;

                            return (
                                <div className="space-y-2 pt-1">
                                    {/* Approved confirmation — centered pop-up */}
                                    {actionState === "approved" && !confirmDismissed && (
                                        <div
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                            onClick={() => setConfirmDismissed(true)}
                                        >
                                            <div
                                                className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-6 max-w-sm w-full mx-4 space-y-3"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <CheckCircle2 size={22} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-emerald-800">{approveSuccess}</p>
                                                        <p className="text-xs text-emerald-700 mt-0.5">{approveForward}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 flex-wrap gap-y-1">
                                                    <span className="text-[11px] text-emerald-700 font-semibold">New Status:</span>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${nextStatusCls}`}>{nextStatusLabel}</span>
                                                </div>
                                                <p className="text-[11px] text-emerald-600">Action recorded in request history · {ts}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => { setConfirmDismissed(true); onClose(); }}
                                                    className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejected confirmation — centered pop-up */}
                                    {actionState === "rejected" && !confirmDismissed && (
                                        <div
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                            onClick={() => setConfirmDismissed(true)}
                                        >
                                            <div
                                                className="bg-white rounded-2xl shadow-2xl border border-red-200 p-6 max-w-sm w-full mx-4 space-y-3"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                        <XCircle size={22} className="text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-red-700">Request Rejected &amp; Closed</p>
                                                        <p className="text-xs text-red-600 mt-0.5">
                                                            The request has been permanently closed. Remaining workflow stages are terminated.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-red-200 flex-wrap gap-y-1">
                                                    <span className="text-[11px] text-red-700 font-semibold">New Status:</span>
                                                    <span className="text-[11px] px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full font-bold">{rejectedByLabel}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-red-200 text-red-800 border-red-300">Closed</span>
                                                </div>
                                                {rejectComment && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">Reason for Rejection</p>
                                                        <p className="text-xs text-foreground">{rejectComment}</p>
                                                    </div>
                                                )}
                                                <p className="text-[11px] text-red-500">Action recorded in request history · {ts} · Employee notified.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => { setConfirmDismissed(true); onClose(); }}
                                                    className="w-full py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection options — LM / ICT */}
                                    {rejectMode && actionState === "idle" && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                            <p className="text-xs font-bold text-red-800">Reject &amp; Close Request</p>
                                            <p className="text-[11px] text-red-700">This permanently closes the request. Later stages will not remain waiting.</p>
                                            <label className="block text-xs font-bold text-red-800">
                                                Reason for Rejection <span className="text-red-500">*</span>
                                            </label>
                                            <textarea rows={3} value={rejectComment} onChange={e => setRejectComment(e.target.value)}
                                                placeholder="State the reason for permanently closing this request..."
                                                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                                            <div className="flex gap-2">
                                                <button disabled={apiBusy || !rejectComment.trim()}
                                                    onClick={() => { if (rejectComment.trim()) void runReject(); }}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${apiBusy || !rejectComment.trim() ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 shadow-sm"}`}>
                                                    <X size={12} /> Confirm Reject &amp; Close
                                                </button>
                                                <button onClick={() => { setRejectMode(false); setRejectComment(""); setRejectType(null); }}
                                                    className="px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold text-foreground/60 hover:bg-muted transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {actionState === "idle" && !rejectMode && (
                                        <div className="flex gap-2">
                                            <button disabled={apiBusy} onClick={() => void runApprove()}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 ${apiBusy ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                                                <Check size={13} /> {apiBusy ? "Submitting…" : "Approve"}
                                            </button>
                                            <button onClick={() => setRejectMode(true)}
                                                className="flex-1 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                                                <X size={13} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </>}
        </div>
    );
}