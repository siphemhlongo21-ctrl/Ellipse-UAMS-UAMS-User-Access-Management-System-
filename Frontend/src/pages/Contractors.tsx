import { useState } from "react";
import { DocumentViewerModal } from "../components/DocumentViewerModal";
import { type DocumentDetails, type RequestDetails } from "../api";
import { FileText, Plus, CheckCircle2, AlertCircle, Upload, Shield, Eye, Briefcase, X, Check, RotateCcw } from "lucide-react";
import type { UserSession } from "../types/UserSession";
import { type Request } from "../types/Request";
import { ContractorForm } from "./request/ContractorForm";
import { loadServerViewerDocument, revokeViewerDocument, formatBytes } from "../utilities";
import { EnvBadge } from "../components/controls/EnvBadge";
import { StatusBadge } from "../components/controls/StatusBadge";
import { type DocumentAccessLogEntry } from "../types/DocumentAccessLogEntry";
import { type ViewerDocument } from "../types/ViewerDocument";

// ─── Contractor Access Management ─────────────────────────────────────────────

export function Contractors({ session, onDone, onOpenRequest, requests = [] }: {
    session: UserSession;
    onDone?: () => void;
    onOpenRequest?: (id: number) => void;
    requests?: RequestDetails[];
}) {
    const roles = session.roles;
    const [showForm, setShowForm] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<ViewerDocument | null>(null);
    const [viewingRequestId, setViewingRequestId] = useState<number | undefined>();
    const [docPickerFor, setDocPickerFor] = useState<Request | null>(null);
    const [docPickerDocs, setDocPickerDocs] = useState<DocumentDetails[]>([]);
    const [docPickerLoading, setDocPickerLoading] = useState(false);
    const [loadingDocId, setLoadingDocId] = useState<number | null>(null);
    const [docAccessLog, setDocAccessLog] = useState<DocumentAccessLogEntry[]>(INITIAL_DOC_ACCESS_LOG);
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, string[]>>({});
    const [responseSent, setResponseSent] = useState<Record<string, boolean>>({});

    // Contractor applications are managed only by Line Managers (submit & amend on behalf)
    if (roles?.includes("LINE_MANAGER")) {
        return (
            <div className="p-6">
                <div className="max-w-lg mx-auto bg-white border border-border rounded-xl p-6 text-center shadow-sm">
                    <Shield size={28} className="mx-auto text-foreground/30 mb-3" />
                    <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                        Authorised access only
                    </h2>
                    <p className="text-sm text-foreground/50 mt-2">
                        Contractor applications are submitted and amended by Line Managers on the contractor’s behalf.
                    </p>
                    <button
                        type="button"
                        onClick={() => onDone?.()}
                        className="mt-4 px-4 py-2 text-xs font-bold text-white rounded-lg"
                        style={{ background: "#1a2d6e" }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <ContractorForm
                onClose={() => setShowForm(false)}
                onSubmit={() => { setShowForm(false); onDone?.(); }}
                session={session}
            />
        );
    }

    const contractorApps = requests.filter(r => r.userType === "Contractor");
    const needsAmendment = contractorApps.filter(r =>
        r.status === "Awaiting Resubmission" || r.status === "awaiting-information",
    );
    const inProgress = contractorApps.filter(r =>
        r.status !== "Awaiting Resubmission" && r.status !== "awaiting-information",
    );

    const openContractorDocs = async (c: Request) => {
        setViewingRequestId(c.id);
        setDocPickerFor(c);
        setDocPickerDocs([]);
        // const numericId = parseNumericRequestId(c);
        // if (!numericId) return;
        // setDocPickerLoading(true);
        // try {
        //     setDocPickerDocs(await documentsApi.getByRequest(numericId) ?? []);
        // } catch {
        //     setDocPickerDocs([]);
        // } finally {
        //     setDocPickerLoading(false);
        // }
    };

    const openStoredDocument = async (doc: DocumentDetails) => {
        setLoadingDocId(doc.id);
        try {
            const viewerDoc = await loadServerViewerDocument(doc);
            revokeViewerDocument(viewingDoc);
            setViewingDoc(viewerDoc);
            setDocPickerFor(null);
        } finally {
            setLoadingDocId(null);
        }
    };

    const closeContractorViewer = () => {
        revokeViewerDocument(viewingDoc);
        setViewingDoc(null);
        setViewingRequestId(undefined);
    };

    const toggleDoc = (reqId: number, doc: string) => {
        setUploadedDocs(prev => {
            const current = prev[reqId] ?? [];
            return {
                ...prev,
                [reqId]: current.includes(doc) ? current.filter(d => d !== doc) : [...current, doc],
            };
        });
    };

    const renderContractorCard = (c: RequestDetails, highlightAmendment: boolean) => {
        const docs = uploadedDocs[c.id] ?? [];
        const sent = responseSent[c.id];
        const isResponding = respondingId === c.id;

        return (
            <div
                key={c.id}
                className={`bg-white border rounded-xl p-4 space-y-3 shadow-sm ${highlightAmendment ? "border-purple-300 ring-1 ring-purple-100" : "border-border"
                    }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary">{c.id}</span>
                            <StatusBadge status={c.status ?? ""} />
                            <EnvBadge env={c.env} />
                            {highlightAmendment && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-purple-50 text-purple-700 border-purple-200">
                                    Needs your response
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-bold text-foreground">{c.employeeName ?? c.contractorName}</h3>
                        <p className="text-xs text-foreground/50">{c.companyName ?? c.department}</p>
                    </div>
                    {c.endDate && (
                        <div className="text-right shrink-0">
                            <div className="text-[10px] text-foreground/40 uppercase tracking-wide font-semibold">Expires</div>
                            <div className="text-sm font-mono font-bold text-orange-600">{c.endDate}</div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { name: "Identity Document", ok: true },
                        // { name: "Contractor ID Card", ok: c.docsUploaded ?? false },
                        // { name: "Contract Documentation", ok: c.docsUploaded ?? false },
                    ].map(doc => (
                        <div key={doc.name} className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium
              ${doc.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                            {doc.ok ? <Check size={10} /> : <AlertCircle size={10} />}
                            <span className="truncate">{doc.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void openContractorDocs(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-semibold text-foreground/70 hover:bg-secondary transition-colors"
                    >
                        <Eye size={12} /> View Documents
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenRequest?.(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-semibold text-foreground/70 hover:bg-secondary transition-colors"
                    >
                        <FileText size={12} /> Open Request
                    </button>
                    {highlightAmendment && (
                        <button
                            type="button"
                            onClick={() => setRespondingId(isResponding ? null : c.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                        >
                            <RotateCcw size={12} /> {isResponding ? "Hide Response" : "Respond / Amend"}
                        </button>
                    )}
                </div>

                {highlightAmendment && isResponding && (
                    <div className="border-t border-purple-200 pt-3 space-y-2">
                        <p className="text-xs font-bold text-purple-800">Respond on behalf of contractor</p>
                        <p className="text-[11px] text-purple-600">
                            Re-upload the flagged documents, then submit your response to return the request to HC review.
                        </p>
                        {["Contractor ID Card", "Contract Documentation"].map(doc => (
                            <div key={doc} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs
                ${docs.includes(doc) ? "bg-emerald-50 border-emerald-200" : "bg-white border-red-200"}`}>
                                <div className="flex items-center gap-2">
                                    {docs.includes(doc)
                                        ? <CheckCircle2 size={12} className="text-emerald-600" />
                                        : <AlertCircle size={12} className="text-red-500" />}
                                    <span className={docs.includes(doc) ? "text-emerald-700 font-semibold" : "text-red-700"}>{doc}</span>
                                </div>
                                {!docs.includes(doc)
                                    ? <button
                                        type="button"
                                        onClick={() => toggleDoc(c.id, doc)}
                                        className="flex items-center gap-1 px-2.5 py-1 text-white rounded text-[11px] font-bold"
                                        style={{ background: "#1a2d6e" }}
                                    >
                                        <Upload size={10} /> Upload
                                    </button>
                                    : <button type="button" onClick={() => toggleDoc(c.id, doc)} className="text-[10px] text-foreground/40 hover:text-red-500 px-2">Remove</button>}
                            </div>
                        ))}
                        {docs.length === 2 && !sent && (
                            <button
                                type="button"
                                onClick={() => setResponseSent(prev => ({ ...prev, [c.id]: true }))}
                                className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center justify-center gap-1.5"
                            >
                                <Check size={12} /> Submit Amendment Response
                            </button>
                        )}
                        {sent && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> Response sent — pending HC Systems Officer review
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                        Contractor Applications
                    </h1>
                    <p className="text-sm text-foreground/50 mt-0.5">
                        {"Submit and manage contractor access requests on their behalf — including amendment responses"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold hover:opacity-90 shadow-sm"
                    style={{ background: "#1a2d6e" }}
                >
                    <Plus size={14} /> New Contractor Request
                </button>

            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Shield size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                    Line Managers own the contractor application lifecycle: submission, document uploads, and responses when an application is returned for amendment.
                </p>
            </div>

            {needsAmendment.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                        <RotateCcw size={12} /> Needs Amendment / Your Response
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-100 border border-purple-200 font-mono">{needsAmendment.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {needsAmendment.map(c => renderContractorCard(c, true))}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={12} /> All Contractor Applications
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted border border-border font-mono text-foreground/50">{inProgress.length}</span>
                </h3>
                {inProgress.length === 0 ? (
                    <div className="bg-white border border-dashed border-border rounded-xl p-8 text-center text-sm text-foreground/40">
                        No other contractor applications yet. Use <strong>New Contractor Request</strong> to submit one.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {inProgress.map(c => renderContractorCard(c, false))}
                    </div>
                )}
            </div>

            {docPickerFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <button
                        type="button"
                        aria-label="Close document list"
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
                        onClick={() => setDocPickerFor(null)}
                    />
                    <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                                    Supporting Documents
                                </h3>
                                <p className="text-[11px] text-foreground/50 truncate">
                                    {docPickerFor.id} · {docPickerFor.employee}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDocPickerFor(null)}
                                className="rounded-lg p-1.5 text-foreground/40 hover:bg-muted hover:text-foreground transition-colors"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-auto p-4 space-y-2">
                            {docPickerLoading ? (
                                <p className="py-6 text-center text-sm text-foreground/40">Loading documents…</p>
                            ) : docPickerDocs.length === 0 ? (
                                <p className="py-6 text-center text-sm text-foreground/40">
                                    No documents uploaded for this application yet.
                                </p>
                            ) : (
                                docPickerDocs.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate">
                                                {doc.documentType || "Supporting document"}
                                            </p>
                                            <p className="text-[11px] text-foreground/50 font-mono truncate" title={doc.fileName ?? undefined}>
                                                {doc.fileName || `Document-${doc.id}`} · {formatBytes(doc.contentLength)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={loadingDocId === doc.id}
                                            onClick={() => void openStoredDocument(doc)}
                                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-secondary disabled:opacity-50"
                                        >
                                            <Eye size={12} /> {loadingDocId === doc.id ? "Opening…" : "Preview"}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {viewingDoc && (
                <DocumentViewerModal
                    document={viewingDoc}
                    requestId={viewingRequestId}
                    viewerName={session.displayName}
                    viewerRole={"roles"}
                    accessLog={docAccessLog}
                    onClose={closeContractorViewer}
                    onAccessLogged={(entry) => setDocAccessLog(prev => [entry, ...prev])}
                />
            )}
        </div>
    );
}