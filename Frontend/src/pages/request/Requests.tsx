import { useState, useEffect } from "react";
import { Plus, Search, Loader } from "lucide-react";
import { roleDefaultStatusFilter, canCreateAccessRequest, hasAppRole } from "../../utilities/request";
import { getEmployeeRequests, getHcSystemsOfficerRequests, getICTManagerRequests, GetLineManagerRequestsByEmail, getRequests, getTrainingVerificationRequests } from "../../api/requestsApi";
import type { RequestDetails } from "../../api";
import { EnvBadge } from "../../components/controls/EnvBadge";
import { StatusBadge } from "../../components/controls/StatusBadge";
import { NewRequestModal } from "../../components/request/NewRequestModal";
import { useNavigate } from "react-router-dom";
import type { Env } from "../../types";
import type { UserSession } from "../../types/UserSession";
import { useAuth } from "../../context/AuthProvider";
import { formatDateTime } from "../../api/mappers";

function loadRoleQueue(session: UserSession, signal?: AbortSignal): Promise<RequestDetails[]> {
    const roles = session.roles ?? [];
    const email = session.email ?? "";

    if (roles.includes("SYSTEM_ADMIN")) {
        return getRequests(signal);
    }
    if (roles.includes("HC_SYSTEMS_OFFICER")) {
        return getHcSystemsOfficerRequests(signal);
    }
    if (roles.includes("ICT_MANAGER")) {
        return getICTManagerRequests(signal);
    }
    if (roles.includes("TRAINING_CENTRE")) {
        return getTrainingVerificationRequests(signal);
    }
    if (roles.includes("LINE_MANAGER") && email) {
        return GetLineManagerRequestsByEmail(email, signal);
    }
    if (roles.includes("EMPLOYEE") && email) {
        return getEmployeeRequests(email, signal);
    }

    return Promise.resolve([]);
}

// â”€â”€â”€ Request List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function RequestList() {

    const { session } = useAuth();

    const navigate = useNavigate();

    const [showReqModal, setShowReqModal] = useState(false);
    const [search, setSearch] = useState("");
    const [envFilter, setEnvFilter] = useState("ALL");
    // Role-specific default queue status for live workflow stages
    const [statusFilter, setStatus] = useState(roleDefaultStatusFilter(session?.roles ?? []));
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [sourceRequests, setSourceRequests] = useState<RequestDetails[]>([]);
    const [requestsLoading, setRequestsLoading] = useState<boolean>(true);
    const canChangeStatusFilter = ["EMPLOYEE", "LINE_MANAGER", "SYSTEM_ADMIN"].some(r => session?.roles?.includes(r));

    useEffect(() => {
        if (session === null) {
            navigate("/login", { replace: true });
        }
    }, [session, navigate]);

    useEffect(() => {
        if (!session) {
            return;
        }

        let cancelled = false;
        const abortController = new AbortController();
        setRequestsLoading(true);

        void loadRoleQueue(session, abortController.signal)
            .then((data) => {
                if (!cancelled) {
                    setSourceRequests(data);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    console.log(error);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setRequestsLoading(false);
                }
            });

        return () => {
            cancelled = true;
            abortController.abort();
        };
    }, [session]);

    if (session === null) {
        return null;
    }

    const openNewRequest = session.roles?.includes("LINE_MANAGER") ? () => setShowReqModal(true) : () => navigate("/requests/employee/new", { replace: true });

    const lockedEnvs: Env[] = hasAppRole(session.roles, "TRAINING_CENTRE") ? ["Production"] : hasAppRole(session.roles, "ICT_MANAGER") ? ["Test", "Development"] : [];
    const canNewReq = canCreateAccessRequest(session.roles);
    const searchQuery = search.trim().toLowerCase();
    const effectiveStatusFilter = searchQuery ? "all" : statusFilter;

    const filtered = sourceRequests.filter(r => {
        const matchSearch = !searchQuery
            || String(r.id).includes(searchQuery)
            || (r.requestNumber?.toLowerCase().includes(searchQuery) ?? false)
            || (r.employeeName?.toLowerCase().includes(searchQuery) ?? false)
            || (r.contractorName?.toLowerCase().includes(searchQuery) ?? false)
            || (r.serviceNumber?.toLowerCase().includes(searchQuery) ?? false)
            || (r.department?.toLowerCase().includes(searchQuery) ?? false);
        const matchEnv = lockedEnvs.length > 0 ? lockedEnvs.includes(r.environment as Env) : (envFilter === "ALL" || r.environment === envFilter);
        const matchStatus = effectiveStatusFilter === "all"
            || r.status === effectiveStatusFilter;
        const matchFrom = !dateFrom || r.requestedDate >= dateFrom;
        const matchTo = !dateTo || r.requestedDate <= dateTo;
        return matchSearch && matchEnv && matchStatus && matchFrom && matchTo;
    });

    return (
        <div className="flex h-full">
            <div className="flex flex-col w-full border-r border-border bg-white">
                <div className="p-4 border-b border-border bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Access Requests</h1>
                            {lockedEnvs.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-foreground/50">Showing:</span>
                                    {lockedEnvs.map(e => <EnvBadge key={e} env={e} />)}
                                    <span className="text-[11px] text-foreground/50">only</span>
                                </div>
                            )}
                            {requestsLoading && (
                                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader className="animate-spin w-16 h-16 text-indigo-600" />
                                        <p className="text-sm font-bold text-white">Loading...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {canNewReq && (
                            <button onClick={openNewRequest}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                                style={{ background: "#1a2d6e" }}>
                                <Plus size={13} /> New Request
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, name, department..."
                                className="w-full pl-8 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-colors" />
                        </div>
                        {lockedEnvs.length === 0 && (
                            <select value={envFilter} onChange={e => setEnvFilter(e.target.value)}
                                className="px-2 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                                <option value="ALL">All Envs</option>
                                <option value="Production">PROD</option>
                                <option value="Test">TEST</option>
                                <option value="Development">DEV</option>
                            </select>
                        )}
                        <select value={statusFilter} onChange={e => setStatus(e.target.value)} disabled={!canChangeStatusFilter}
                            className="px-2 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="all">All Status</option>
                            <option value="Awaiting Line Manager Approval">Pending Manager Review</option>
                            <option value="Training Verification Pending">Pending Training Verification</option>
                            <option value="ICT Manager Approval Pending">Pending ICT Review</option>
                            <option value="Hc Systems Officer Implementation Pending">Pending HC Implementation</option>
                            <option value="Awaiting Resubmission">Awaiting Resubmission</option>
                            <option value="Implemented">Implemented</option>
                            <option value="Rejected">Closed</option>
                        </select>
                    </div>
                    {/* Date range filter */}
                    <div className="flex gap-2 mt-2 items-center">
                        <span className="text-[11px] text-foreground/50 font-semibold shrink-0">Date:</span>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                        <span className="text-[11px] text-foreground/40">to</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                                className="text-[11px] text-foreground/40 hover:text-foreground px-1.5 py-1 border border-border rounded bg-white transition-colors">
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 sticky top-0">
                                {["Request ID", "Type", "Employee", "Department", "Env", "Submitted", "Status"].map(h => (
                                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold text-foreground/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map(req => (
                                <tr key={req.id} onClick={() => navigate("/requests/" + req.id, { replace: true })}
                                    className={`cursor-pointer hover:bg-muted/40 transition-colors`}>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-xs font-bold text-primary">{req.requestNumber}</span>
                                            {req.userType === "Contractor" && <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold">CTR</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-foreground/70">{req.requestType}</td>
                                    <td className="px-3 py-2.5">
                                        <div className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</div>
                                        <div className="text-[10px] font-mono text-foreground/40">{req.serviceNumber}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-foreground/60 max-w-[130px] truncate">{req.department}</td>
                                    <td className="px-3 py-2.5"><EnvBadge env={req.environment ?? ""} /></td>
                                    <td className="px-3 py-2.5 text-xs font-mono text-foreground/50 whitespace-nowrap">{formatDateTime(req.requestedDate)}</td>
                                    <td className="px-3 py-2.5"><StatusBadge status={req.status ?? "draft"} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && !requestsLoading && (
                        <div className="p-10 text-center text-sm text-foreground/40">No requests match the current filter.</div>
                    )}
                </div>
            </div>

            {/* New Request type selection modal */}
            {showReqModal && (
                <NewRequestModal onClose={() => setShowReqModal(false)} />
            )}
        </div>
    );
}





