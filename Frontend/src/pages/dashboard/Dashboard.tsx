import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import type { RequestDetails } from "../../api/types";
import { ExpiryQuickViewModal } from "../../components/ExpiryQuickViewModal";
import { AlertCircle, Building2, Check, CheckCircle2, ChevronRight, Clock, Database, Eye, Plus, RefreshCw, RotateCcw, X, XCircle, Zap } from "lucide-react";
import { EnvBadge } from "../../components/controls/EnvBadge";
import { StatusBadge } from "../../components/controls/StatusBadge";
import { TYPE_ICONS } from "../../utilities/type_icon";
import { getEmployeeRequests, GetLineManagerRequestsByEmail, getICTManagerRequests, getTrainingVerificationRequests, getRequests, getHcSystemsOfficerRequests } from "../../api/requestsApi";
import { ExpiryMonitorPage } from "../../components/ExpiryMonitorPage";
import { NewRequestModal } from "../../components/request/NewRequestModal";
import { EXPIRY_CATEGORY_META, EXPIRY_COLOR_CLASSES, type ExpiryCategoryId } from "../../types/dashboard";
import { expiryDaysLeft, getExpiryCategoryItems } from "../../utilities/dashboard";
import { canCreateAccessRequest } from "../../utilities/request";
import type { Env } from "../../types";
import { formatDateTime } from "../../api/mappers";


export function Dashboard() {
    const navigate = useNavigate();
    const { session } = useAuth();
    const roles = session?.roles;
    const canNewReq = canCreateAccessRequest(roles);
    const [showReqModal, setShowReqModal] = useState(false);
    const openNewRequest = roles?.includes("LINE_MANAGER")
        ? () => setShowReqModal(true)
        : () => navigate("/requests/employee/new");
    const [expiryQuickView, setExpiryQuickView] = useState<{ req: RequestDetails; category: ExpiryCategoryId } | null>(null);
    const [expiryViewAll, setExpiryViewAll] = useState<ExpiryCategoryId | null>(null);
    const [total, setTotal] = useState<Number>(0);
    const [pending, setPending] = useState<Number>(0);
    const [approved, setApproved] = useState<Number>(0);
    const [rejected, setRejected] = useState<Number>(0);
    const [contractors, setContractors] = useState<Number>(0);
    const [expiring, setExpiring] = useState<Number>(0);
    const [requests, setRequests] = useState<RequestDetails[]>([]);

    const envFilter: Env[] =
        roles?.includes("TRAINING_CENTRE") ? ["Production"] :
            roles?.includes("ICT_MANAGER") ? ["Test", "Development"] :
                [];


    if (session?.roles?.includes("EMPLOYEE") && session.email) {
        useEffect(() => {
            let cancelled = false;
            async function load() {
                try {
                    const data = await getEmployeeRequests(session?.email ?? "");
                    if (!cancelled) {
                        setRequests(data);
                        setTotal(data.length);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.log(err instanceof Error ? err.message : "Failed to load requests.");
                    }
                }
            }
            void load();
            return () => {
                cancelled = true;
            };
        }, []);
    }

    if (session?.roles?.includes("LINE_MANAGER") && session.email) {
        useEffect(() => {
            let cancelled = false;
            async function load() {
                try {
                    const data = await GetLineManagerRequestsByEmail(session?.email ?? "");
                    if (!cancelled) {
                        setRequests(data);
                        setTotal(data.length);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.log(err instanceof Error ? err.message : "Failed to load requests.");
                    }
                }
            }
            void load();
            return () => {
                cancelled = true;
            };
        }, []);
    }

    if (session?.roles?.includes("ICT_MANAGER")) {
        useEffect(() => {
            let cancelled = false;
            async function load() {
                try {
                    const data = await getICTManagerRequests();
                    if (!cancelled) {
                        setRequests(data);
                        setTotal(data.length);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.log(err instanceof Error ? err.message : "Failed to load requests.");
                    }
                }
            }
            void load();
            return () => {
                cancelled = true;
            };
        }, []);
    }


    if (session?.roles?.includes("TRAINING_CENTRE")) {
        useEffect(() => {
            let cancelled = false;
            async function load() {
                try {
                    const data = await getTrainingVerificationRequests();
                    if (!cancelled) {
                        setRequests(data);
                        setTotal(data.length);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.log(err instanceof Error ? err.message : "Failed to load requests.");
                    }
                }
            }
            void load();
            return () => {
                cancelled = true;
            };
        }, []);
    }

    if (session?.roles?.includes("SYSTEM_ADMIN")) {
        useEffect(() => {
            let cancelled = false;
            async function load() {
                try {
                    const data = await getRequests();
                    if (!cancelled) {
                        setRequests(data);
                        setTotal(data.length);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.log(err instanceof Error ? err.message : "Failed to load requests.");
                    }
                }
            }
            void load();
            return () => {
                cancelled = true;
            };
        }, []);
    }

    if (session?.roles?.includes("HC_SYSTEMS_OFFICER")) {
        useEffect(() => {
            let cancelled = false;
            async function load() {
                try {
                    const data = await getHcSystemsOfficerRequests();
                    if (!cancelled) {
                        setRequests(data);
                        setTotal(data.length);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.log(err instanceof Error ? err.message : "Failed to load requests.");
                    }
                }
            }
            void load();
            return () => {
                cancelled = true;
            };
        }, []);
    }

    const filtered = envFilter.length > 0 ? requests.filter(r => envFilter.includes(r.environment as Env)) : requests;


    if (roles?.includes("EMPLOYEE")) {
        useEffect(() => {
            setTotal(filtered.length);
            setPending(filtered.filter(r => r.status === "Awaiting Line Manager Approval"
                || r.status === "Training Verification Pending"
                || r.status === "Awaiting ICT Manager Approval"
                || r.status === "Awaiting Hc Systems Officer Implementation"
            ).length);
            setApproved(filtered.filter(r => r.status === "Implemented").length);
            setRejected(filtered.filter(r => r.status === "Rejected").length);
        }, []);
    }

    if (roles?.includes("LINE_MANAGER")) {
        useEffect(() => {

            setTotal(filtered.length);
            setPending(filtered.filter(r => r.status === "Awaiting Line Manager Approval").length);
            setApproved(filtered.filter(r => r.status === "Implemented").length);
            setRejected(filtered.filter(r => r.status === "Rejected").length);
            const today = new Date();

            const expiring = requests.filter(r => {
                if (!r.endDate) return false;
                const days = Math.ceil((new Date(r.endDate ?? "").getTime() - today.getTime()) / 86400000);
                return days >= 0 && days <= 30;
            })

            setExpiring(expiring.length);

        }, [requests, filtered]); 
    }

    if (roles?.includes("HC_SYSTEMS_OFFICER") && expiryViewAll) {
        return (
            <ExpiryMonitorPage
                category={expiryViewAll}
                onBack={() => setExpiryViewAll(null)}
                requests={requests}
            />
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                        Welcome, {session?.displayName.split(" ")[0]}
                    </h1>
                    <p className="text-sm text-foreground/50 mt-0.5">
                        {/* {ROLE_LABELS[roles]} */}
                        {envFilter.length > 0 && <> · {envFilter.join(" & ")} environment{envFilter.length > 1 ? "s" : ""}</>}
                    </p>
                </div>
                {canNewReq && (
                    <button
                        type="button"
                        onClick={openNewRequest}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                        style={{ background: "#1a2d6e" }}
                    >
                        <Plus size={13} /> New Request
                    </button>
                )}
            </div>

            {/* Employee expiry - US-09 */}
            {/* roles?.includes("new-employee") */
                (() => {

                    //To do: part of phase 2
                    // const expiringSoon = requests.filter(r => isExpiringSoon(r, 14));
                    // const expired = requests.filter(r => isExpired(r));
                    // if (expiringSoon.length === 0 && expired.length === 0) return null;
                    // return (
                    //     <div className="space-y-2">
                    //         {expired.map(r => (
                    //             <div key={r.id} className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    //                 <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    //                 <div className="flex-1">
                    //                     <p className="text-sm font-bold text-red-700">Access Expired - {r.id}</p>
                    //                     <p className="text-xs text-red-600 mt-0.5">
                    //                         Your {r.environment} access expired on <span className="font-bold">{r.endDate}</span>. Submit a new request if you still need access.
                    //                     </p>
                    //                 </div>
                    //                 <button
                    //                     type="button"
                    //                     onClick={() => navigate("/requests/employee/new", { replace: true })}
                    //                     className="shrink-0 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100"
                    //                 >
                    //                     Request New Access
                    //                 </button>
                    //                 <button
                    //                     type="button"
                    //                     onClick={() => navigate("/requests/" + r.id, { replace: true })}
                    //                     className="shrink-0 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-bold text-foreground/70 hover:bg-muted"
                    //                 >
                    //                     View Details
                    //                 </button>
                    //             </div>
                    //         ))}
                    //         {expiringSoon.map(r => {
                    //             const days = expiryDaysLeft(r.endDate!);
                    //             return (
                    //                 <div key={r.id} className="flex items-start gap-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    //                     <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    //                     <div className="flex-1">
                    //                         <p className="text-sm font-bold text-amber-800">
                    //                             Access Expiring {days == 0 ? "Today" : `in ${days} day${days == 1 ? "" : "s"}`} - {r.id}
                    //                         </p>
                    //                         <p className="text-xs text-amber-700 mt-0.5">
                    //                             Your {r.environment} Ellipse access expires on <span className="font-bold">{r.endDate}</span>. Submit a new request to avoid interruption.
                    //                         </p>
                    //                     </div>
                    //                     <button
                    //                         type="button"
                    //                         onClick={() => navigate("/requests/employee/new", { replace: true })}
                    //                         className="shrink-0 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-800 hover:bg-amber-100"
                    //                     >
                    //                         Request New Access
                    //                     </button>
                    //                     <button
                    //                         type="button"
                    //                         onClick={() => navigate("/requests/" + r.id, { replace: true })}
                    //                         className="shrink-0 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-bold text-foreground/70 hover:bg-muted"
                    //                     >
                    //                         View Details
                    //                     </button>

                    //                 </div>
                    //             );
                    //         })}
                    //     </div>
                    // );
                })()}

            {/* Contractor expiry notifications */}
            {(() => {
                const today = new Date();
                const myReqs = requests.filter(r => r.userType === "Contractor" && (r.status === "Implemented" || r.status === "Awaiting Line Manager Approval"));
                const expiring = myReqs.filter(r => {
                    if (!r.endDate) return false;
                    const days = Math.ceil((new Date(r.endDate ?? "").getTime() - today.getTime()) / 86400000);
                    return days >= 0 && days <= 30;
                });
                const expired = myReqs.filter(r => {
                    if (!r.endDate) return false;
                    return new Date(r.endDate) < today;
                });
                if (expiring.length === 0 && expired.length === 0) return null;
                return (
                    <div className="space-y-2">
                        {expired.map(r => (
                            <div key={r.id} className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-700">Access Expired — {r.id}</p>
                                    <p className="text-xs text-red-600 mt-0.5">Your {r.environment} access expired on <span className="font-bold">{r.endDate}</span>. Please submit a renewal request if continued access is required.</p>
                                </div>
                                <span className="shrink-0 text-xs text-red-600 italic">Contact your Line Manager to renew</span>
                            </div>
                        ))}
                        {expiring.map(r => {
                            const days = Math.ceil((new Date(r.endDate!).getTime() - today.getTime()) / 86400000);
                            return (
                                <div key={r.id} className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-800">
                                            Access Expiring {days === 0 ? "Today" : `in ${days} day${days === 1 ? "" : "s"}`} — {r.id}
                                        </p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Your {r.environment} Ellipse access expires on <span className="font-bold">{r.endDate}</span>. Submit a renewal request to avoid interruption.
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-amber-700 italic">Contact your Line Manager to renew</span>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}


            {roles?.includes("LINE_MANAGER") && (() => {

                const allKpis = [
                    { label: "Total", value: total, left: "#1a2d6e", val: "text-foreground" },
                    { label: "Pending", value: pending, left: "#d97706", val: "text-amber-600" },
                    { label: "Approved", value: approved, left: "#059669", val: "text-emerald-700" },
                    { label: "Rejected", value: rejected, left: "#dc2626", val: "text-red-600" },
                    { label: "Contractors", value: contractors, left: "#0284c7", val: "text-sky-700" },
                    { label: "Expiring", value: expiring, left: "#ea580c", val: "text-orange-600" },
                ];
                const kpis = allKpis.filter(k => k.label === "Expiring")

                return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        {kpis.map(kpi => (
                            <div key={kpi.label} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-2 shadow-sm"
                                style={{ borderLeft: `3px solid ${kpi.left}` }}>
                                <div className={`text-2xl font-bold ${kpi.value}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{kpi.value}</div>
                                <div className="text-[11px] text-foreground/50 font-semibold leading-tight">{kpi.label}</div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Training Centre — Awaiting Verification panel */}
            {roles?.includes("TRAINING_CENTRE") && (
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-border bg-teal-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-teal-600" /> Requests Awaiting Training Verification
                        </h3>
                        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full">
                            {requests.length} items
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                        <EnvBadge env={req.environment ?? ""} />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</p>
                                    <p className="text-xs text-foreground/50">{req.userAccessType} · {req.department} · Submitted {formatDateTime(req.requestedDate)}</p>
                                </div>
                                <button
                                    onClick={() => navigate("/requests/" + req.id, { replace: true })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors shadow-sm shrink-0">
                                    <Eye size={12} /> View Details
                                </button>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <div className="p-6 text-center text-sm text-foreground/40">No requests currently awaiting training verification.</div>
                        )}
                    </div>
                </div>
            )}

            {/* ICT Manager — Awaiting Approval panel */}
            {roles?.includes("ICT_MANAGER") && (
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-border bg-sky-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Clock size={14} className="text-sky-600" /> Requests Awaiting ICT Manager Approval
                        </h3>
                        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full">
                            {requests.length} items
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                        <EnvBadge env={req.environment ?? ""} />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</p>
                                    <p className="text-xs text-foreground/50">{req.userAccessType} · {req.department} · Submitted {formatDateTime(req.requestedDate)}</p>
                                </div>
                                <button
                                    onClick={() => navigate("/requests/" + req.id, { replace: true })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors shadow-sm shrink-0">
                                    <Eye size={12} /> View Details
                                </button>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <div className="p-6 text-center text-sm text-foreground/40">No requests currently awaiting ICT Manager approval.</div>
                        )}
                    </div>
                </div>
            )}

            {/* HC Admin — Expiry Monitoring Widgets */}
            {roles?.includes("HC_SYSTEMS_OFFICER") && (() => {
                const widgetDefs: { id: ExpiryCategoryId; label: string; items: RequestDetails[]; color: "sky" | "teal" | "orange" | "violet" }[] = [
                    { id: "test", label: EXPIRY_CATEGORY_META.test.label, items: getExpiryCategoryItems("test", requests), color: "sky" },
                    { id: "dev", label: EXPIRY_CATEGORY_META.dev.label, items: getExpiryCategoryItems("dev", requests), color: "teal" },
                    { id: "contractor", label: EXPIRY_CATEGORY_META.contractor.label, items: getExpiryCategoryItems("contractor", requests), color: "orange" },
                    { id: "acting", label: EXPIRY_CATEGORY_META.acting.label, items: getExpiryCategoryItems("acting", requests), color: "violet" },
                ];

                return (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle size={12} className="text-orange-500" /> Temporary Access Expiry Monitoring
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {widgetDefs.map(({ id, label, items, color }) => {
                                const cls = EXPIRY_COLOR_CLASSES[color];
                                return (
                                    <div key={id} className={`rounded-xl border shadow-sm overflow-hidden ${items.length > 0 ? cls.card : "border-border bg-white"}`}>
                                        <div className="px-4 py-3 border-b border-inherit flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-foreground">{label}</p>
                                                <p className="text-[10px] text-foreground/50 mt-0.5">Next 60 days</p>
                                            </div>
                                            <span className={`text-lg font-bold font-mono ${items.length > 0 ? "text-foreground" : "text-foreground/30"}`}>{items.length}</span>
                                        </div>

                                        {items.length > 0 ? (
                                            <div className="divide-y divide-border/50">
                                                {items.slice(0, 3).map(r => (
                                                    <div key={r.id} className="px-4 py-2.5 flex items-center gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-foreground truncate">{r.employeeName ?? r.contractorName}</p>
                                                            <p className="text-[10px] text-foreground/50 truncate">{r.userAccessType}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-foreground/50">Expires: <span className="font-mono text-orange-600 font-semibold">{r.endDate}</span></span>
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${cls.badge}`}>
                                                                    {expiryDaysLeft(r.endDate!)} days
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpiryQuickView({ req: r, category: id })}
                                                            className={`flex items-center gap-1 px-2 py-1.5 text-white rounded text-[10px] font-bold transition-colors shadow-sm shrink-0 ${cls.btn}`}
                                                        >
                                                            <Eye size={10} /> Quick View
                                                        </button>
                                                    </div>
                                                ))}
                                                {items.length > 3 && (
                                                    <div className="px-4 py-2 text-[10px] text-foreground/45 bg-white/40">
                                                        +{items.length - 3} more — use View All to see the full list
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-5 text-center text-xs text-foreground/40">No records expiring in the next 60 days.</div>
                                        )}

                                        <div className="px-4 py-2 border-t border-inherit flex items-center justify-between bg-white/60">
                                            <p className="text-[10px] text-foreground/40">{items.length} record{items.length !== 1 ? "s" : ""} expiring</p>
                                            <button
                                                type="button"
                                                onClick={() => setExpiryViewAll(id)}
                                                className="text-[10px] font-semibold text-primary hover:underline"
                                            >
                                                View All →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* HC Admin — Awaiting Implementation panel (uses dedicated dummy data to ensure panel is never empty) */}
            {roles?.includes("HC_SYSTEMS_OFFICER") && (
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-border bg-sky-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Zap size={14} className="text-sky-600" /> Requests Awaiting Implementation
                        </h3>
                        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full">
                            {requests.length} items
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {requests.length === 0 ? (
                            <div className="p-6 text-center text-sm text-foreground/40">No requests awaiting implementation.</div>
                        ) : null}
                        {requests.map(req => (
                            <div key={req.id}
                                onClick={() => navigate("/requests/" + req.id, { replace: true })}
                                className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                        <EnvBadge env={req.environment ?? ""} />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</p>
                                    <p className="text-xs text-foreground/50">{req.userAccessType} · {req.department} · Submitted {formatDateTime(req.requestedDate)}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); navigate("/requests/" + req.id, { replace: true }); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors shadow-sm shrink-0">
                                        <Eye size={12} /> View Details
                                    </button>
                                    <ChevronRight size={13} className="text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Manager queue */}
            {roles?.includes("LINE_MANAGER") && (
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-border bg-amber-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Clock size={14} className="text-amber-600" /> Pending Your Approval
                        </h3>
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">{pending} items</span>
                    </div>
                    <div className="divide-y divide-border">
                        {filtered.filter(r => r.status === "Awaiting Line Manager Approval").map(req => (
                            <div key={req.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                        <EnvBadge env={req.environment ?? ""} />
                                        {req.userType === "Contractor" && (
                                            <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold">CTR</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</p>
                                    <p className="text-xs text-foreground/50">{req.userAccessType} · {req.department}</p>
                                </div>
                                <button
                                    onClick={() => navigate("/requests/" + req.id, { replace: true })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors shadow-sm shrink-0">
                                    <Eye size={12} /> View Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Line Manager — Contractor applications & amendment responses */}
            {roles?.includes("LINE_MANAGER") && (() => {
                const contractorApps = requests.filter(r => r.userType === "Contractor");
                const needsResponse = contractorApps.filter(r =>
                    r.status === "Awaiting Resubmission" || r.status === "awaiting-information",
                );
                const activeApps = contractorApps.filter(r =>
                    r.status !== "Awaiting Resubmission" && r.status !== "awaiting-information",
                );
                return (
                    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-border bg-sky-50 flex items-center justify-between gap-3 flex-wrap">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Building2 size={14} className="text-sky-700" /> Contractor Applications
                            </h3>
                            <div className="flex items-center gap-2">
                                {needsResponse.length > 0 && (
                                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                                        {needsResponse.length} need response
                                    </span>
                                )}
                            </div>
                        </div>

                        {needsResponse.length > 0 && (
                            <div className="border-b border-border">
                                <div className="px-5 py-2 bg-purple-50/80">
                                    <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                                        <RotateCcw size={11} /> Amendments — respond on contractor’s behalf
                                    </p>
                                </div>
                                <div className="divide-y divide-border">
                                    {needsResponse.map(req => (
                                        <div key={req.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                                    <EnvBadge env={req.environment ?? ""} />
                                                    <StatusBadge status={req.status ?? "draft"} />
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</p>
                                                <p className="text-xs text-foreground/50">
                                                    {req.companyName ?? req.department} · Returned for amendment
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="divide-y divide-border">
                            {activeApps.slice(0, 4).map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => navigate("/requests/" + req.id, { replace: true })}
                                    className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                                            <EnvBadge env={req.environment ?? ""} />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">{req.employeeName ?? req.contractorName}</p>
                                        <p className="text-xs text-foreground/50">{req.companyName ?? req.department}</p>
                                    </div>
                                    <StatusBadge status={req.status ?? "draft"} />
                                    <ChevronRight size={13} className="text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                            ))}
                            {contractorApps.length === 0 && (
                                <div className="p-6 text-center text-sm text-foreground/40">
                                    No contractor applications yet. Use New Access Request → Contractor.
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Recent list */}
            {(
                <div className={`grid grid-cols-1 xl:grid-cols-3 gap-4`}>
                    {!roles?.includes("TRAINING_CENTRE") && (
                        <div className="bg-white border border-border rounded-xl shadow-sm">
                            <div className="p-4 border-b border-border">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Database size={14} className="text-accent" /> Environment Breakdown
                                </h3>
                            </div>
                            <div className="p-4">
                                {(["Production", "Test", "Development"] as const).filter(e => envFilter.length === 0 || envFilter.includes(e)).map(env => {
                                    const userFiltered = roles?.includes("EMPLOYEE") ? filtered.filter(r => r.employeeName === session?.displayName) : filtered;
                                    const count = userFiltered.filter(r => r.environment === env).length;
                                    const userTotal = userFiltered.length;
                                    const pct = userTotal > 0 ? Math.round((count / userTotal) * 100) : 0;
                                    const bar = { Production: "bg-violet-500", Test: "bg-sky-500", Development: "bg-teal-500" };
                                    return (
                                        <div key={env} className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-mono font-bold text-foreground/60">{env}</span>
                                                <span className="font-mono font-bold text-foreground">{count}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${bar[env]} rounded-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={`${!roles?.includes("TRAINING_CENTRE") ? "xl:col-span-2" : "xl:col-span-3"} bg-white border border-border rounded-xl shadow-sm`}>
                        <div className="p-4 border-b border-border">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <RefreshCw size={14} className="text-accent" /> Recent Requests
                            </h3>
                        </div>
                        <div className="divide-y divide-border">
                            {/* Employee sees only their own recent requests */}
                            {(roles?.includes("EMPLOYEE") ? filtered.filter(r => r.employeeName === session?.displayName) : filtered)
                                .slice(0, 5).map(req => (
                                    <div key={req.id} className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0">{TYPE_ICONS[req.userAccessType ?? ""]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-foreground truncate">{req.employeeName ?? req.contractorName}</div>
                                            <div className="text-[11px] text-foreground/50">{req.userAccessType} · {req.department}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <StatusBadge status={req.status ?? "draft"} />
                                            <EnvBadge env={req.environment ?? ""} />
                                        </div>
                                        <ChevronRight size={13} className="text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {expiryQuickView && (
                <ExpiryQuickViewModal
                    req={expiryQuickView.req}
                    category={expiryQuickView.category}
                    onClose={() => setExpiryQuickView(null)}
                />
            )}

            {/* New Request type selection modal (same as Requests page) */}
            {showReqModal && (
                <NewRequestModal onClose={() => setShowReqModal(false)} />
            )}
        </div>
    );
}
