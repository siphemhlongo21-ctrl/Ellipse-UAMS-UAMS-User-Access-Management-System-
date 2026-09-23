export interface Approver {
  name: string;
  role: string;
  status: "pending" | "approved" | "rejected" | "waiting" | "training-verified" | "implemented" | "closed";
  actionLabel?: string;   // e.g. "Approved", "Training Verified", "Implemented"
  date?: string;          // e.g. "2026-06-22"
  time?: string;          // e.g. "09:14"
  comments?: string;
}