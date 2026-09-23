
import { FileText, CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw } from "lucide-react";

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description?: string }> = {
  // ── Active workflow statuses ──────────────────────────────────────────────
  "draft": { label: "Draft", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: <FileText size={11} />, description: "Request is saved but has not been submitted for approval." },
  "Awaiting Line Manager Approval": { label: "Pending Line Manager Approval", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <Clock size={11} />, description: "Request submitted and awaiting Line Manager approval." },
  "Training Verification Pending": { label: "Pending Training Centre Verification", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", icon: <Clock size={11} />, description: "Line Manager approved (PROD). Awaiting Training Centre verification of training completion." },
  "ICT Manager Approval Pending": { label: "Pending ICT Manager Approval", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", icon: <Clock size={11} />, description: "Line Manager approved (TEST/DEV). Awaiting ICT Manager approval." },
  "Hc Systems Officer Implementation Pending": { label: "Pending HC Systems Officer Implementation", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: <Clock size={11} />, description: "Prior approvals complete. Awaiting HC Systems Officer to implement access in Ellipse." },
  "pending-hc-review": { label: "Pending HC Systems Officer Review", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: <Clock size={11} />, description: "Employee has resubmitted the requested documents. HC Systems Officer must review." },
  "awaiting-information": { label: "Awaiting Information", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <AlertCircle size={11} />, description: "HC Systems Officer has requested additional documents. Line Manager responds for contractors; employees respond for staff requests." },
  // ── Completed statuses ────────────────────────────────────────────────────
  "access-implemented": { label: "Access Implemented", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={11} />, description: "Access has been granted in Ellipse by the HC Systems Officer. The request lifecycle is complete." },
  // ── Rejection statuses ────────────────────────────────────────────────────
  "rejected-by-lm": { label: "Rejected by Line Manager", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <XCircle size={11} />, description: "The Line Manager rejected and closed this request. No further workflow stages remain open." },
  "rejected-by-tc": { label: "Rejected by Training Centre", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <XCircle size={11} />, description: "The Training Centre rejected and closed this request. No further workflow stages remain open." },
  "rejected-by-ict": { label: "Rejected by ICT Manager", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <XCircle size={11} />, description: "The ICT Manager rejected and closed this request. No further workflow stages remain open." },
  "rejected-by-hc": { label: "Rejected by HC Systems Officer", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <XCircle size={11} />, description: "The HC Systems Officer rejected and closed this request. No further workflow stages remain open." },
  // ── Legacy statuses (kept for backward compat with mock data) ─────────────
  "approved": { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={11} />, description: "Approved." },
  "Rejected": { label: "Rejected & Closed", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <XCircle size={11} />, description: "Request was rejected or cancelled and is closed." },
  "Implemented": { label: "Implemented", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", icon: <CheckCircle2 size={11} />, description: "Implemented." },
  "expired": { label: "Expired", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <AlertCircle size={11} />, description: "The access end date has passed." },
  "Awaiting Resubmission": { label: "Awaiting Re-submission", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", icon: <RotateCcw size={11} />, description: "Documents require re-upload. Line Manager responds for contractors." },
};