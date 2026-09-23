import { useState, useEffect } from "react";
import { DocumentViewerModal } from "../components/DocumentViewerModal";
import { documentsApi, type DocumentDetails, type RequestDetails, } from "../api";
import { type DocumentAccessLogEntry } from "../types/DocumentAccessLogEntry";
import { FileText, Search, Clock, Shield, Eye, Download, X, Check } from "lucide-react";
import { type ViewerDocument } from "../types/ViewerDocument";
import { loadServerViewerDocument, revokeViewerDocument, formatBytes } from "../utilities";
import { type ReqStatus } from "../types/ReqStatus";
import { STATUS_CONFIG } from "../utilities/status_config";
import { EnvBadge } from "../components/controls/EnvBadge";
import { formatDateTime } from "../api/mappers";
import { StatusBadge } from "../components/controls/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Login from "./auth/Login";

// ─── Audit & Historical Records (HC Systems Officer) ────────────────────

export function AuditHistory({ requests = [] }: { requests?: RequestDetails[] }) {

    const { session } = useAuth();
    const navigate = useNavigate();

    if (session === null) {
        return <Login />;
    }

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<RequestDetails | null>(null);
    const [activeTab, setActiveTab] = useState<"timeline" | "documents">("timeline");
    const [viewingDoc, setViewingDoc] = useState<ViewerDocument | null>(null);
    const [docAccessLog, setDocAccessLog] = useState<DocumentAccessLogEntry[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<DocumentDetails[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [loadingDocId, setLoadingDocId] = useState<number | null>(null);

    const openStoredDocument = async (doc: DocumentDetails) => {
        setLoadingDocId(doc.id);
        try {
            const viewerDoc = await loadServerViewerDocument(doc);
            revokeViewerDocument(viewingDoc);
            setViewingDoc(viewerDoc);
        } finally {
            setLoadingDocId(null);
        }
    };

    const downloadStoredDocument = async (doc: DocumentDetails) => {
        try {
            const { blob, fileName } = await documentsApi.downloadBlob(doc.id);
            const url = URL.createObjectURL(blob);
            const anchor = window.document.createElement("a");
            anchor.href = url;
            anchor.download = doc.fileName || fileName || `Document-${doc.id}`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch {
            // Download failures surface through the viewer's access log only.
        }
    };

    const ALL_STATUSES: ReqStatus[] = ["implemented", "Awaiting Resubmission", "rejected", "approved", "pending", "expired", "access-implemented", "pending-hc-implementation"];
    const allReqs = requests;
    const filtered = allReqs.filter(r => {
        const q = search.toLowerCase();
        return !q || r.employeeName?.toLowerCase().includes(q) || r.id.toString().toLowerCase().includes(q)
            || r.serviceNumber?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q);
    });

    useEffect(() => {
        if (!selected?.id) {
            setSelectedDocs([]);
            return;
        }
        let cancelled = false;
        setDocsLoading(true);
        documentsApi.getByRequest(selected.id)
            .then((docs) => { if (!cancelled) setSelectedDocs(docs ?? []); })
            .catch(() => { if (!cancelled) setSelectedDocs([]); })
            .finally(() => { if (!cancelled) setDocsLoading(false); });
        return () => { cancelled = true; };
    }, [selected?.id]);
    return (
        <div className="flex h-full">
            {/* Left: request list */}
            <div className={`flex flex-col ${selected ? "w-[45%]" : "w-full"} border-r border-border bg-white`}>
                <div className="p-4 border-b border-border">
                    <h1 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: "Barlow, sans-serif" }}>
                        Audit & Historical Records
                    </h1>
                    <p className="text-xs text-foreground/50 mb-3">Complete request history, workflow timelines, and document retrieval for audit purposes.</p>
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, ID, service number..."
                                className="w-full pl-8 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-colors" />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold text-foreground/60 hover:bg-muted transition-colors shadow-sm">
                            <Download size={13} /> Export
                        </button>
                    </div>
                    {/* Status filter pills */}
                    <div className="flex gap-1.5 flex-wrap">
                        {ALL_STATUSES.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                    {cfg.icon}{cfg.label}: {requests.filter(r => r.status === s).length}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 sticky top-0">
                                {["ID", "Employee", "Type", "Env", "Submitted", "Status"].map(h => (
                                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold text-foreground/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map(req => (
                                <tr key={req.id} onClick={() => { setSelected(selected?.id === req.id ? null : req); setActiveTab("timeline"); }}
                                    className={`cursor-pointer hover:bg-muted/40 transition-colors ${selected?.id === req.id ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                            {req.userType === "Contractor" && <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold">CTR</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</div>
                                        <div className="text-[10px] font-mono text-foreground/40">{req.serviceNumber}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-foreground/60 max-w-[120px] truncate">{req.userAccessType}</td>
                                    <td className="px-3 py-2.5"><EnvBadge env={req.environment ?? ""} /></td>
                                    <td className="px-3 py-2.5 text-xs font-mono text-foreground/50 whitespace-nowrap">{formatDateTime(req.requestedDate)}</td>
                                    <td className="px-3 py-2.5"><StatusBadge status={req.status ?? "draft"} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary bar */}
                <div className="border-t border-border px-4 py-2 bg-muted/30 flex items-center justify-between text-[11px] text-foreground/50">
                    <span>{filtered.length} records found</span>
                    <span className="font-mono">{requests.filter(r => r.status === "implemented" || r.status === "access-implemented").length} implemented · {requests.filter(r => r.status === "pending" || r.status === "Training Verification Pending" || r.status === "Hc Systems Officer Implementation Pending" || r.status === "pending-hc-implementation").length} pending</span>
                </div>
            </div>

            {/* Right: detail panel */}
            {selected && (
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-start justify-between sticky top-0 bg-white z-10 shadow-sm">
                        <div>
                            <span className="font-mono text-xs font-bold text-accent">{selected.id}</span>
                            <h2 className="text-base font-bold text-foreground mt-0.5" style={{ fontFamily: "Barlow, sans-serif" }}>
                                {selected.employeeName ?? selected.contractorName}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <StatusBadge status={selected.status ?? ""} />
                                <EnvBadge env={selected.environment ?? ""} />
                            </div>
                        </div>
                        <button onClick={() => setSelected(null)} className="text-foreground/40 hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-border px-4 flex gap-0">
                        {(["timeline", "documents"] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 text-xs font-bold capitalize border-b-2 transition-colors
                  ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-foreground/50 hover:text-foreground"}`}>
                                {tab === "timeline" ? "Workflow Timeline" : "Document Retrieval"}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto p-4">

                        {/* ── Workflow Timeline ── */}
                        {activeTab === "timeline" && (
                            <div className="space-y-4">
                                {/* Request meta */}
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        ["Request Type", selected.userAccessType],
                                        ["Submitted", formatDateTime(selected.requestedDate)],
                                        ["Department", selected.department],
                                        ["Branch", selected.branch],
                                        ...(selected.userType === "Contractor" ? [["Company", selected.companyName ?? "—"]] : [["Designation", selected.designation ?? "-"]]),
                                        ["Service No.", selected.serviceNumber],
                                    ].map(([l, v]) => (
                                        <div key={String(l)} className="bg-muted/60 rounded-lg p-2.5 border border-border">
                                            <div className="text-[10px] text-foreground/50 uppercase tracking-wide font-semibold mb-0.5">{l}</div>
                                            <div className="text-xs text-foreground font-medium">{v}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Status definition */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Current Status — {STATUS_CONFIG[selected.status].label}</p>
                                    <p className="text-xs text-foreground/70">{STATUS_CONFIG[selected.status].description}</p>
                                </div>

                                {/* Full chronological timeline */}
                                <div>
                                    <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Clock size={12} className="text-accent" /> Complete Workflow Timeline
                                    </h4>
                                    <div className="relative">
                                        {/* Vertical line */}
                                        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border" />
                                        <div className="space-y-0">
                                            {/* Submitted event */}
                                            <div className="flex gap-3 pb-4">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 z-10">
                                                    <FileText size={11} className="text-primary" />
                                                </div>
                                                <div className="flex-1 bg-white border border-border rounded-lg p-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-xs font-bold text-foreground">Request Submitted</p>
                                                            <p className="text-[11px] text-foreground/50">Submitted by {selected.employeeName}</p>
                                                        </div>
                                                        <div className="text-right text-[10px] text-foreground/40 font-mono">
                                                            <div>{formatDateTime(selected.requestedDate)}</div>
                                                            <div>08:00</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Approver events */}
                                            {/* {selected.approvers.map((a, i) => {
                                                const done = a.status === "approved" || a.status === "training-verified" || a.status === "implemented" || a.status === "rejected";
                                                const iconColor = a.status === "rejected" ? "border-red-400 bg-red-50" : done ? "border-emerald-500 bg-emerald-50" : a.status === "pending" ? "border-amber-400 bg-amber-50" : "border-slate-300 bg-slate-50";
                                                return (
                                                    <div key={i} className="flex gap-3 pb-4">
                                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${iconColor}`}>
                                                            {done ? (a.status === "rejected" ? <X size={11} className="text-red-500" /> : <Check size={11} className="text-emerald-600" />) : <span className="text-[10px] font-bold text-foreground/40">{i + 2}</span>}
                                                        </div>
                                                        <div className={`flex-1 rounded-lg border p-3 ${done ? "bg-white border-border" : "bg-muted/30 border-border/50"}`}>
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="text-xs font-bold text-foreground">{a.actionLabel ?? a.role}</p>
                                                                    <p className="text-[11px] text-foreground/50">{a.name} · {a.role}</p>
                                                                </div>
                                                                {done && a.date && (
                                                                    <div className="text-right text-[10px] text-foreground/40 font-mono">
                                                                        <div>{a.date}</div>
                                                                        <div>{a.time}</div>
                                                                    </div>
                                                                )}
                                                                {!done && (
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border
                                    ${a.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                                                        {a.status === "pending" ? "Pending" : "Waiting"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {a.comments && (
                                                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                                                                    <span className="font-bold">Note: </span>{a.comments}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })} */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Document Retrieval ── */}
                        {activeTab === "documents" && (
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                                    <Shield size={13} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-blue-700">
                                        <p className="font-bold">POPIA — Restricted Access</p>
                                        <p>Document retrieval is logged. Authorised HC Systems Officer access only. All views and downloads are recorded for audit purposes.</p>
                                    </div>
                                </div>

                                {docsLoading ? (
                                    <div className="text-center py-8 text-foreground/40 text-sm">Loading documents…</div>
                                ) : selectedDocs.length === 0 ? (
                                    <div className="text-center py-8 text-foreground/40 text-sm">No documents on record for this request.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDocs.map((doc) => {
                                            const fileName = doc.fileName || doc.documentType || `Document-${doc.id}`;
                                            const sizeLabel = formatBytes(doc.contentLength);
                                            const uploaded = doc.dateUploaded ? String(doc.dateUploaded).slice(0, 10) : "—";
                                            return (
                                                <div key={doc.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                                                            <FileText size={18} className="text-foreground/40" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{fileName}</p>
                                                            <p className="text-[11px] text-foreground/50">{sizeLabel} · Uploaded {uploaded} · {doc.documentType || "Document"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={loadingDocId === doc.id}
                                                            onClick={() => void openStoredDocument(doc)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-semibold text-foreground/70 hover:bg-secondary transition-colors disabled:opacity-50"
                                                        >
                                                            <Eye size={12} /> {loadingDocId === doc.id ? "Opening…" : "View"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void downloadStoredDocument(doc)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-semibold text-foreground/70 hover:bg-secondary transition-colors"
                                                        >
                                                            <Download size={12} /> Download
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Document access audit log */}
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center gap-2">
                                        <Shield size={12} className="text-foreground/50" />
                                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Document Retrieval Audit Log</span>
                                    </div>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/20">
                                                {["User", "Role", "Action", "Document", "Date", "Time"].map(h => (
                                                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-foreground/50 uppercase tracking-wide">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {docAccessLog.map((entry, i) => (
                                                <tr key={i} className="hover:bg-muted/20">
                                                    <td className="px-3 py-2 font-semibold text-foreground">{entry.user}</td>
                                                    <td className="px-3 py-2 text-foreground/60">{entry.role ?? "—"}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${entry.action === "Downloaded" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                            {entry.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground/60 max-w-[180px] truncate font-mono text-[10px]">
                                                        {entry.document ? `${selected.id} — ${entry.document}` : selected.id}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-foreground/50">{entry.date}</td>
                                                    <td className="px-3 py-2 font-mono text-foreground/50">{entry.time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewingDoc && selected && (
                <DocumentViewerModal
                    document={viewingDoc}
                    requestId={selected.id}
                    viewerName="Amashree Naidoo"
                    viewerRole="HC Systems Officer"
                    accessLog={docAccessLog}
                    onClose={() => { revokeViewerDocument(viewingDoc); setViewingDoc(null); }}
                    onAccessLogged={(entry) => setDocAccessLog(prev => [entry, ...prev])}
                />
            )}
        </div>
    );
}