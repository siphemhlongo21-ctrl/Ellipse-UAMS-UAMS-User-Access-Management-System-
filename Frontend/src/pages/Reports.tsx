import { useState, useEffect, useCallback } from "react";
import { reportsApi, ApiError, type AccessRequestReportRow, type ContractorAccessReportRow } from "../api";
import { FileText, AlertCircle, Shield, Download, RefreshCw, Briefcase, Globe, ChevronDown, Filter, Loader2 } from "lucide-react";
import { STATUS_CONFIG } from "../utilities/status_config";
import type { ReqStatus } from "../types/ReqStatus";
import { StatusBadge } from "../components/controls/StatusBadge";
import { EnvBadge } from "../components/controls/EnvBadge";
import { useAuth } from "../context/AuthProvider";
import Login from "./auth/Login";
import { formatDateTime } from "../api/mappers";

// ─── Reports ──────────────────────────────────────────────────────────────────

type ReportFilters = {
    fromUtc: string;
    toUtc: string;
    environment: string;
    requestType: string;
    status: string;
    companyName: string;
    accessState: string;
    activeOnly: boolean;
};

const EMPTY_REPORT_FILTERS: ReportFilters = {
    fromUtc: "",
    toUtc: "",
    environment: "",
    requestType: "",
    status: "",
    companyName: "",
    accessState: "",
    activeOnly: false,
};

const REPORT_STATUS_OPTIONS = [
    "Draft",
    "Submitted",
    "Pending",
    "Approved",
    "Rejected",
    "Implemented",
    "ReturnedForAmendment",
    "Cancelled",
];

const REPORT_REQUEST_TYPE_OPTIONS = [
    "New Employee",
    "Create Signon",
    "New Employee & Create Signon",
    "Primary Position Amendment",
    "Secondary Position Amendment",
    "Signon-Menu",
    "Temporary Position Amendment",
    "Acting Position Amendment",
    "Terminate & Delete Signon",
    "Terminate Secondary Position",
    "Update Existing Employee Record Details",
    "Other",
];

function toUtcIso(date: string, endOfDay = false): string | undefined {
    if (!date) return undefined;
    return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`).toISOString();
}

function formatReportDate(value?: string | null): string {
    if (!value) return "—";
    // Zoneless API timestamps are UTC (see parseApiDate in api/mappers.ts) —
    // without the "Z" the value displays 2 hours behind SAST.
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
    const parsed = new Date(hasZone ? value : `${value.trim()}Z`);
    if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
    return parsed.toLocaleDateString("en-ZA");
}

function ReportStatusChip({ status }: { status?: string | null }) {
    if (!status) return <span className="text-foreground/40">—</span>;
    if (status in STATUS_CONFIG) {
        return <StatusBadge status={status as ReqStatus ?? ""} />;
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
            {status}
        </span>
    );
}


export function Reports() {
    const { session } = useAuth();

    if (session === null) {
        return <Login />;
    }

    const [draft, setDraft] = useState<ReportFilters>(EMPTY_REPORT_FILTERS);
    const [applied, setApplied] = useState<ReportFilters>(EMPTY_REPORT_FILTERS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accessRows, setAccessRows] = useState<AccessRequestReportRow[]>([]);
    const [envRows, setEnvRows] = useState<AccessRequestReportRow[]>([]);
    const [contractorRows, setContractorRows] = useState<ContractorAccessReportRow[]>([]);

    const loadReports = useCallback(async (filters: ReportFilters) => {
        setLoading(true);
        setError(null);
        try {
            const fromUtc = toUtcIso(filters.fromUtc);
            const toUtc = toUtcIso(filters.toUtc, true);

            const [access, environment, contractors] = await Promise.all([
                reportsApi.accessRequests({
                    fromUtc,
                    toUtc,
                    environment: filters.environment || undefined,
                    requestType: filters.requestType || undefined,
                    status: filters.status || undefined,
                }),
                reportsApi.environmentAccess({
                    environment: filters.environment || undefined,
                    activeOnly: filters.activeOnly || undefined,
                }),
                reportsApi.contractorAccess({
                    companyName: filters.companyName.trim() || undefined,
                    contractEndFrom: fromUtc,
                    contractEndTo: toUtc,
                    accessState: filters.accessState || undefined,
                }),
            ]);

            setAccessRows(access ?? []);
            setEnvRows(environment ?? []);
            setContractorRows(contractors ?? []);
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? `API ${err.status}: ${err.message || "Request failed"}`
                    : err instanceof Error
                        ? err.message
                        : "Failed to load reports";
            setError(message);
            setAccessRows([]);
            setEnvRows([]);
            setContractorRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadReports(EMPTY_REPORT_FILTERS);
    }, [loadReports]);

    const applyFilters = () => {
        setApplied(draft);
        void loadReports(draft);
    };

    const clearFilters = () => {
        setDraft(EMPTY_REPORT_FILTERS);
        setApplied(EMPTY_REPORT_FILTERS);
        void loadReports(EMPTY_REPORT_FILTERS);
    };

    const hasActiveFilters = Object.entries(applied).some(([key, value]) =>
        key === "activeOnly" ? value === true : Boolean(value),
    );

    const statusCounts = accessRows.reduce<Record<string, number>>((acc, row) => {
        const key = row.status || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const envSummary = (["PRODUCTION", "TEST", "DEVELOPMENT"] as const).map(env => {
        const rows = envRows.filter(r => (r.environment || "").toUpperCase() === env);
        const active = rows.filter(r => {
            const s = (r.status || "").toLowerCase();
            return s.includes("approv") || s.includes("implement") || s === "active";
        }).length;
        const pending = rows.filter(r => (r.status || "").toLowerCase().includes("pend")).length;
        return { env, total: rows.length, pending, active };
    });

    const exportCsv = () => {
        const header = ["RequestNumber", "Type", "Environment", "Status", "Department", "Email", "RequestedDate"];
        const lines = accessRows.map(r =>
            [
                r.requestNumber ?? r.requestId,
                r.requestType ?? "",
                r.environment ?? "",
                r.status ?? "",
                r.department ?? "",
                r.employeeEmail ?? "",
               formatDateTime(r.requestedDate) ?? "",
            ]
                .map(v => `"${String(v).replace(/"/g, '""')}"`)
                .join(","),
        );
        const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ellipse-access-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const setDraftField = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) =>
        setDraft(prev => ({ ...prev, [key]: value }));

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Reports</h1>
                    <p className="text-sm text-foreground/50 mt-0.5">Phase 1 reporting — access requests, environments, contractors</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void loadReports(applied)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold text-foreground/70 hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={accessRows.length === 0}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold text-foreground/70 hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Download size={13} /> Export
                    </button>
                </div>
            </div>

            {/* Shared filter bar */}
            <div className="bg-white border border-border rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-accent" />
                        <h2 className="text-sm font-bold text-foreground">Report Filters</h2>
                        {hasActiveFilters && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold">
                                Filters active
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-foreground/40">Applies to all report cards below</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">From date</label>
                        <input
                            type="date"
                            value={draft.fromUtc}
                            onChange={e => setDraftField("fromUtc", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">To date</label>
                        <input
                            type="date"
                            value={draft.toUtc}
                            onChange={e => setDraftField("toUtc", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Environment</label>
                        <div className="relative">
                            <select
                                value={draft.environment}
                                onChange={e => setDraftField("environment", e.target.value)}
                                className="appearance-none w-full px-2.5 pr-7 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                            >
                                <option value="">All</option>
                                <option value="PRODUCTION">PROD</option>
                                <option value="TEST">TEST</option>
                                <option value="DEVELOPMENT">DEV</option>
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Request type</label>
                        <div className="relative">
                            <select
                                value={draft.requestType}
                                onChange={e => setDraftField("requestType", e.target.value)}
                                className="appearance-none w-full px-2.5 pr-7 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                            >
                                <option value="">All</option>
                                {REPORT_REQUEST_TYPE_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Status</label>
                        <div className="relative">
                            <select
                                value={draft.status}
                                onChange={e => setDraftField("status", e.target.value)}
                                className="appearance-none w-full px-2.5 pr-7 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                            >
                                <option value="">All</option>
                                {REPORT_STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Company</label>
                        <input
                            type="text"
                            value={draft.companyName}
                            onChange={e => setDraftField("companyName", e.target.value)}
                            placeholder="Contractor company"
                            className="w-full px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Access state</label>
                        <div className="relative">
                            <select
                                value={draft.accessState}
                                onChange={e => setDraftField("accessState", e.target.value)}
                                className="appearance-none w-full px-2.5 pr-7 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                            >
                                <option value="">All</option>
                                <option value="Active">Active</option>
                                <option value="Expiring">Expiring</option>
                                <option value="Expired">Expired</option>
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground cursor-pointer w-full">
                            <input
                                type="checkbox"
                                checked={draft.activeOnly}
                                onChange={e => setDraftField("activeOnly", e.target.checked)}
                                className="rounded border-border"
                            />
                            Active access only
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={applyFilters}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                        style={{ background: "#1a2d6e" }}
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Filter size={12} />}
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs font-semibold text-foreground/60 border border-border rounded-lg bg-white hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Clear
                    </button>
                    <span className="ml-auto text-[11px] text-foreground/40 font-mono">
                        {accessRows.length} access · {envRows.length} env · {contractorRows.length} contractor
                    </span>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-700">
                        <p className="font-bold">Could not load reports from API</p>
                        <p className="mt-0.5">{error}</p>
                        <p className="mt-1 text-red-600/80">Check `VITE_API_BASE_URL` and that the .NET API is reachable.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Access Request Report */}
                <div className="bg-white border border-border rounded-xl shadow-sm">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                        <FileText size={14} className="text-accent" />
                        <h3 className="text-sm font-bold text-foreground">Access Request Report</h3>
                        {loading && <Loader2 size={12} className="animate-spin text-foreground/40 ml-auto" />}
                    </div>
                    <div className="p-4 space-y-4">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border">
                                    {["Status", "Count", "%"].map(h => (
                                        <th key={h} className={`py-2 text-foreground/50 font-bold uppercase text-[10px] tracking-wide ${h !== "Status" ? "text-right" : "text-left"}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {Object.keys(statusCounts).length === 0 ? (
                                    <tr><td colSpan={3} className="py-4 text-center text-foreground/40">{loading ? "Loading…" : "No access requests match the filters."}</td></tr>
                                ) : (
                                    Object.entries(statusCounts).map(([s, count]) => (
                                        <tr key={s}>
                                            <td className="py-2"><ReportStatusChip status={s} /></td>
                                            <td className="py-2 text-right font-mono font-bold text-foreground">{count}</td>
                                            <td className="py-2 text-right font-mono text-foreground/50">
                                                {accessRows.length ? Math.round((count / accessRows.length) * 100) : 0}%
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {accessRows.length > 0 && (
                                <tfoot>
                                    <tr className="border-t border-border">
                                        <td className="py-2 font-bold text-foreground text-xs">Total</td>
                                        <td className="py-2 text-right font-mono font-bold text-foreground">{accessRows.length}</td>
                                        <td className="py-2 text-right font-mono text-foreground/50">100%</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>

                        {accessRows.length > 0 && (
                            <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-muted/60">
                                        <tr className="border-b border-border">
                                            {["Request", "Type", "Env", "Requested"].map(h => (
                                                <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold text-foreground/50 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {accessRows.slice(0, 50).map(r => (
                                            <tr key={r.requestId} className="hover:bg-muted/30">
                                                <td className="px-2 py-1.5 font-mono font-semibold text-primary">{r.requestNumber ?? r.requestId}</td>
                                                <td className="px-2 py-1.5 text-foreground/70 max-w-[140px] truncate">{r.requestType ?? "—"}</td>
                                                <td className="px-2 py-1.5">{r.environment ? <EnvBadge env={r.environment} /> : "—"}</td>
                                                <td className="px-2 py-1.5 font-mono text-foreground/50">{formatReportDate(r.requestedDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Environment Access Report */}
                <div className="bg-white border border-border rounded-xl shadow-sm">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                        <Globe size={14} className="text-accent" />
                        <h3 className="text-sm font-bold text-foreground">Environment Access Report</h3>
                        {loading && <Loader2 size={12} className="animate-spin text-foreground/40 ml-auto" />}
                    </div>
                    <div className="p-4 space-y-4">
                        {envRows.length === 0 && !loading ? (
                            <p className="text-xs text-foreground/40 text-center py-6">No environment access records match the filters.</p>
                        ) : (
                            envSummary.filter(x => applied.environment === "" ? x!== undefined : x.env.toUpperCase() === applied.environment).map(({ env, total, pending, active }) => (
                                <div key={env}>
                                    <div className="flex items-center justify-between mb-2">
                                        <EnvBadge env={env} />
                                        <span className="text-xs font-mono font-bold text-foreground/40">{total} total</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {([["Total", total, "text-foreground"], ["Pending", pending, "text-amber-600"], ["Active", active, "text-emerald-700"]] as const).map(([l, v, c]) => (
                                            <div key={l} className="bg-muted/50 rounded-lg py-2 border border-border">
                                                <div className={`text-lg font-mono font-bold ${c}`}>{v}</div>
                                                <div className="text-[10px] text-foreground/50 font-semibold">{l}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Contractor Access Report */}
                <div className="bg-white border border-border rounded-xl shadow-sm lg:col-span-2">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                        <Briefcase size={14} className="text-accent" />
                        <h3 className="text-sm font-bold text-foreground">Contractor Access Report</h3>
                        {loading && <Loader2 size={12} className="animate-spin text-foreground/40 ml-auto" />}
                    </div>
                    <div className="p-4 overflow-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border">
                                    {["Contractor", "Company", "Env", "Contract End", "Access State", "Status"].map(h => (
                                        <th key={h} className={`py-2 text-foreground/50 font-bold uppercase text-[10px] tracking-wide ${["Contract End", "Access State"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {contractorRows.filter(x => applied.environment === "" ? x!== undefined : x.environment?.toUpperCase() === applied.environment).length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-foreground/40">
                                            {loading ? "Loading…" : "No contractor records match the filters."}
                                        </td>
                                    </tr>
                                ) : (
                                    contractorRows.filter(x => applied.environment === "" ? x!== undefined : x.environment?.toUpperCase() === applied.environment).map(r => {
                                        const accessState = r.accessState || "—";
                                        const statusStyle =
                                            accessState === "Active"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : accessState === "Expiring"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : accessState === "Expired"
                                                        ? "bg-red-50 text-red-600 border-red-200"
                                                        : "bg-slate-100 text-slate-600 border-slate-200";
                                        return (
                                            <tr key={`${r.requestId}-${r.contractId}`}>
                                                <td className="py-2 font-semibold text-foreground">{r.contractorName ?? "—"}</td>
                                                <td className="py-2 text-foreground/50 max-w-[160px] truncate">{r.companyName ?? "—"}</td>
                                                <td className="py-2">{r.environment ? <EnvBadge env={r.environment} /> : "—"}</td>
                                                <td className="py-2 text-right font-mono font-bold text-orange-600">{formatReportDate(r.contractEndDate)}</td>
                                                <td className="py-2 text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>
                                                        {accessState}
                                                    </span>
                                                </td>
                                                <td className="py-2"><ReportStatusChip status={r.status} /></td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-dashed border-border rounded-xl opacity-50 shadow-sm lg:col-span-2">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                        <Shield size={14} className="text-foreground/30" />
                        <h3 className="text-sm font-bold text-foreground">Audit & Compliance Reports</h3>
                        <span className="ml-auto text-[10px] px-2 py-0.5 bg-muted rounded-full text-foreground/40 font-semibold">Phase 2</span>
                    </div>
                    <div className="p-8 text-center">
                        <Shield size={28} className="text-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-foreground/40">Tamper-proof audit trail — available in Phase 2.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}