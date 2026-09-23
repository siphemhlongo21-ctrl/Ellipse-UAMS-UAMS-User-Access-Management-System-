import type { RequestApproverActionDetails, RequestDetails } from "../../api";
import { buildFullTimeline } from "../../utilities";
import { formatDateTime } from "../../api/mappers";

// ─── Workflow Audit Row ───────────────────────────────────────────────────────

export function WorkflowAuditRows({
  approvers,
  req
}: {
  approvers: RequestApproverActionDetails[] | null;
  req?: RequestDetails | null;
}) {
  const timeline = req ? buildFullTimeline(req, approvers) : (approvers ?? []);

  const done = (s?: string | null) =>
    s === "Approved" || s === "Verified" || s === "Implemented" || s === "Rejected" || s === "Closed" || s === "Rejected Training";

  return (
    <div className="mt-3 space-y-1.5">
      {timeline.map((a, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2.5 ${done(a.actionType) ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground">
                {a.name && a.name !== "Awaiting Assignment" ? a.name : a.approverType}
              </div>
              <div className="text-[10px] text-foreground/50">{a.approverType}</div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border
                                ${a.actionType === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : a.actionType === "Verified" ? "bg-teal-50 text-teal-700 border-teal-200"
                    : a.actionType === "Implemented" ? "bg-sky-50 text-sky-700 border-sky-200"
                      : a.actionType === "Rejected Training" ? "bg-red-50 text-red-600 border-red-200"
                        : a.actionType === "Closed" ? "bg-red-50 text-red-700 border-red-200"
                          : a.actionType === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            : a.actionType === "Return For Amendment" ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                {a.actionType ?? "Waiting"}
              </span>
            </div>
          </div>
          {/* Audit timestamp */}
          {done(a.actionType) && a.approverDate && (
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-foreground/50">
              {a.approverDate && <span><span className="font-semibold">Date:</span> {formatDateTime(a.approverDate)}</span>}
              {done(a.actionType) && req?.rejectionReason && (a.actionType === "Rejected" || a.actionType === "Rejected Training") && <span className="col-span-2 text-foreground/60 italic mt-0.5">{req?.rejectionReason}</span>}
              {done(a.actionType) && req?.implementationComments && a.actionType === "Implemented" && <span className="col-span-2 text-foreground/60 italic mt-0.5">{req?.implementationComments}</span>}
              {done(a.actionType) && req?.closureOutcome && (a.actionType === "Closed" || a.actionType === "Implemented" || a.actionType === "Rejected" || a.actionType === "Rejected Training") && <span className="col-span-2 text-foreground/60 italic mt-0.5">{req?.closureOutcome}</span>}
            </div>
          )}

          {(a.actionType === "Rejected" || a.actionType === "Rejected Training") && (
            <div className="mt-1 text-[10px] text-red-600/70 italic">Request rejected — stage terminated</div>
          )}

          {a.actionType === "Closed" && (
            <div className="mt-1 text-[10px] text-green-600/70 italic">Request closed — process complete</div>
          )}
        </div>
      ))}
    </div>
  );
}