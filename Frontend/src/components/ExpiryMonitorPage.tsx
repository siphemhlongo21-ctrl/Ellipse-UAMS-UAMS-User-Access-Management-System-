import { useState } from "react";
import { ChevronRight, Search, Eye, ChevronDown } from "lucide-react";
import { type ExpiryCategoryId, EXPIRY_CATEGORY_META, EXPIRY_COLOR_CLASSES} from "../types/dashboard";
import { getExpiryCategoryItems, expiryDaysLeft } from "../utilities/dashboard";
import { EnvBadge } from "./controls/EnvBadge";
import { ExpiryQuickViewModal } from "./ExpiryQuickViewModal";
import type { RequestDetails } from "../api";
import { useNavigate } from "react-router-dom";

export function ExpiryMonitorPage({
    category,
    onBack,
    requests = [],
}: {
    category: ExpiryCategoryId;
    onBack: () => void;
    requests?: RequestDetails[];
}) {
    const navigate = useNavigate();
    const meta = EXPIRY_CATEGORY_META[category];
    const cls = EXPIRY_COLOR_CLASSES[meta.color];
    const allItems = getExpiryCategoryItems(category, requests);
    const [search, setSearch] = useState("");
    const [urgencyFilter, setUrgencyFilter] = useState<"all" | "7" | "30" | "60">("all");
    const [quickView, setQuickView] = useState<RequestDetails | null>(null);

    const filtered = allItems.filter(r => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || r.employeeName?.toLowerCase().includes(q)
            || r.id.toString().toLowerCase().includes(q)
            || r.department?.toLowerCase().includes(q)
            || (r.companyName ?? "").toLowerCase().includes(q)
            || (r.permanentPostId?.toString().toLowerCase().includes(q) ?? false)
            || (r.temporaryPostId?.toString().toLowerCase().includes(q) ?? false)
            || (r.companyName?.toLowerCase().includes(q) ?? false)
            || (r.contractor?.companyName?.toLowerCase().includes(q) ?? false);
        const days = r.endDate ? expiryDaysLeft(r.endDate) : 999;
        const matchUrgency =
            urgencyFilter === "all" ? true :
                urgencyFilter === "7" ? days <= 7 :
                    urgencyFilter === "30" ? days <= 30 :
                        days <= 60;
        return matchSearch && matchUrgency;
    });

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline mb-2"
                    >
                        <ChevronRight size={12} className="rotate-180" /> Back to Dashboard
                    </button>
                    <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                        {meta.label}
                    </h1>
                    <p className="text-sm text-foreground/50 mt-0.5">{meta.description}</p>
                </div>
                <span className={`text-sm font-mono font-bold px-3 py-1.5 rounded-full border ${cls.badge}`}>
                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Search</label>
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Name, request ID, department, company…"
                            className="w-full pl-8 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wide mb-1">Urgency</label>
                    <div className="relative">
                        <select
                            value={urgencyFilter}
                            onChange={e => setUrgencyFilter(e.target.value as typeof urgencyFilter)}
                            className="appearance-none px-3 pr-8 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                        >
                            <option value="all">All (≤ 60 days)</option>
                            <option value="7">Critical (≤ 7 days)</option>
                            <option value="30">Warning (≤ 30 days)</option>
                            <option value="60">Watch (≤ 60 days)</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                {["Request", "Employee", "Type", "Env", "Expires", "Days Left", "Actions"].map(h => (
                                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-foreground/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-foreground/40">
                                        No expiring records match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(r => {
                                    const days = r.endDate ? expiryDaysLeft(r.endDate) : null;
                                    return (
                                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-bold text-primary">{r.id}</span>
                                                {r.userType === "Contractor" && (
                                                    <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold">CTR</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-foreground">{r.employeeName ?? r.contractorName}</div>
                                                <div className="text-[11px] text-foreground/45 truncate max-w-[180px]">
                                                    {r.userType === "Contractor" ? (r.companyName ?? r.department) : r.department}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-foreground/60 max-w-[160px] truncate">{r.userAccessType}</td>
                                            <td className="px-4 py-3"><EnvBadge env={r.environment ?? ""} /></td>
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-orange-600">{r.endDate ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                {days !== null && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${days <= 7 ? "bg-red-50 text-red-700 border-red-200" :
                                                        days <= 30 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                            cls.badge
                                                        }`}>
                                                        {days} days
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuickView(r)}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 text-white rounded text-[10px] font-bold transition-colors shadow-sm ${cls.btn}`}
                                                    >
                                                        <Eye size={10} /> Quick View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate("/requests/" + r.id, { replace: true })}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-border rounded text-[10px] font-bold text-foreground/70 hover:bg-muted transition-colors"
                                                    >
                                                        Open
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {quickView && (
                <ExpiryQuickViewModal
                    req={quickView}
                    category={category}
                    onClose={() => setQuickView(null)}
                />
            )}
        </div>
    );
}