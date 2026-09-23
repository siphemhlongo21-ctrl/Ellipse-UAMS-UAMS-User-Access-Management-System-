
import { X, Check, Hourglass, Upload } from "lucide-react";
import type { RequestApproverActionDetails } from "../../api";
import { buildFullTimeline } from "../../utilities";

// ─── Workflow Steps ───────────────────────────────────────────────────────────

export function WorkflowSteps({
    approvers,
    req
}: {
    approvers: RequestApproverActionDetails[] | null;
    req?: any;
}) {
    const timeline = req ? buildFullTimeline(req, approvers) : (approvers ?? []);

    const stepColor = (s?: string | null) => {
        if (s === "Approved" || s === "Verified" || s === "Implemented")
            return "border-emerald-500 bg-emerald-50 text-emerald-600";
        if (s === "Rejected" || s === "Rejected Training") return "border-red-500 bg-red-50 text-red-600";
        if (s === "Pending" || s === "Return For Amendment") return "border-amber-400 bg-amber-50 text-amber-600 animate-pulse";
        return "border-slate-300 bg-slate-50 text-slate-400";
    };

    const lineColor = (s?: string | null) =>
        (s === "Approved" || s === "Verified" || s === "Implemented") ? "bg-emerald-400" : "bg-border";

    const done = (s?: string | null) =>
        s === "Approved" || s === "Verified" || s === "Implemented" || s === "Closed";

    return (
        <div className="flex items-start flex-wrap gap-y-2 mt-3">
            {timeline.map((a, i) => (
                <div key={i} className="flex items-center m-3">
                    <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${stepColor(a.actionType)}`}>
                            {done(a.actionType) ? <Check size={12} /> :
                                a.actionType === "Return For Amendment" ? <Hourglass size={12} /> :
                                    (a.actionType === "Rejected" || a.actionType === "Rejected Training") ? <X size={12} /> :
                                        a.actionType === "Amendment Resubmit" ? <Upload size={12} /> : i + 1}
                        </div>
                        <span className="text-[9px] text-foreground/50 mt-1 max-w-[58px] text-center leading-tight">{a.approverType}</span>
                    </div>
                    {i < timeline.length - 1 && (
                        <div className={`w-7 h-px mx-1 mb-4 ${lineColor(a.actionType)}`} />
                    )}
                </div>
            ))}
        </div>
    );
}