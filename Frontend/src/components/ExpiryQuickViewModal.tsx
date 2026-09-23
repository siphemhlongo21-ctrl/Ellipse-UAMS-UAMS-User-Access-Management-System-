import { useEffect } from "react";
import { AlertCircle, X, ArrowRight } from "lucide-react";
import { type ExpiryCategoryId, EXPIRY_CATEGORY_META, EXPIRY_COLOR_CLASSES } from "../types/dashboard";
import { expiryDaysLeft } from "../utilities/dashboard";
import { STATUS_CONFIG } from "../utilities/status_config";
import type { RequestDetails } from "../api";
import { useNavigate } from "react-router-dom";

export function ExpiryQuickViewModal({
    req,
    category,
    onClose,
}: {
    req: RequestDetails;
    category: ExpiryCategoryId;
    onClose: () => void;
}) {
    const navigate = useNavigate();
    const meta = EXPIRY_CATEGORY_META[category];
    const days = req.endDate ? expiryDaysLeft(req.endDate) : null;
    const urgency =
        days === null ? "unknown" :
            days <= 7 ? "critical" :
                days <= 30 ? "warning" : "watch";

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button type="button" className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1px]" aria-label="Close" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                <div className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${EXPIRY_COLOR_CLASSES[meta.color].header}`}>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{meta.label}</p>
                        <h2 className="text-base font-bold text-foreground mt-0.5" style={{ fontFamily: "Barlow, sans-serif" }}>
                            {req.employeeName ?? req.contractorName}
                        </h2>
                        <p className="font-mono text-xs font-bold text-primary mt-1">{req.id}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg text-foreground/40 hover:bg-white/70 hover:text-foreground transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${urgency === "critical" ? "bg-red-50 border-red-200" :
                        urgency === "warning" ? "bg-amber-50 border-amber-200" :
                            "bg-orange-50 border-orange-200"
                        }`}>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-foreground/50">Access expires</p>
                            <p className="text-lg font-mono font-bold text-orange-700">{req.endDate ?? "—"}</p>
                        </div>
                        {days !== null && (
                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${urgency === "critical" ? "bg-red-100 text-red-700 border-red-200" :
                                urgency === "warning" ? "bg-amber-100 text-amber-800 border-amber-200" :
                                    "bg-orange-100 text-orange-700 border-orange-200"
                                }`}>
                                {days} day{days === 1 ? "" : "s"} left
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            ["Request Type", req.userAccessType],
                            ["Environment", req.environment],
                            ["Status", STATUS_CONFIG[req.status]?.label ?? req.status],
                            ["Department", req.department],
                            ["Branch", req.branch],
                            ["Service No.", req.serviceNumber],
                            ...(req.userType === "Contractor"
                                ? [["Company", req.companyName ?? "—"], ["Contract ID", req.contractId ?? "—"]]
                                : [["Designation",  req.designation ?? "-"], ["Email", req.employeeName ??  "—"]]),
                            ["Start Date", req.startDate ?? "—"],
                            ["Submitted", req.requestedDate],
                        ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-lg border border-border bg-muted/40 p-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground/45">{label}</p>
                                <p className="text-xs font-semibold text-foreground mt-0.5 break-words">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <AlertCircle size={13} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700">
                            Temporary access should be reviewed before expiry. Renew, extend, or terminate access via the full request record.
                        </p>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-semibold text-foreground/60 border border-border rounded-lg bg-white hover:bg-muted transition-colors"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/requests/" + req.id, { replace: true })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                        style={{ background: "#1a2d6e" }}
                    >
                        Open Full Request <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}