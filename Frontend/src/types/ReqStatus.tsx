export type ReqStatus =
  | "draft"                     // Saved but not submitted into workflow
  | "pending"                   // Pending Line Manager Approval
  | "pending-tc-verification"   // Pending Training Centre Verification
  | "pending-ict-approval"      // Pending ICT Manager Approval
  | "pending-hc-implementation" // Pending HC Systems Officer Implementation
  | "pending-hc-review"         // Pending HC Systems Officer Review
  | "awaiting-information"      // Awaiting Information (document resubmission)
  | "access-implemented"        // Access Implemented (final completed state)
  | "approved"                  // Legacy — kept for backward compat
  | "rejected"                  // Legacy — kept for backward compat
  | "rejected-by-lm"            // Rejected by Line Manager
  | "rejected-by-tc"            // Rejected by Training Centre
  | "rejected-by-ict"           // Rejected by ICT Manager
  | "rejected-by-hc"            // Rejected by HC Systems Officer
  | "implemented"               // Legacy — kept for backward compat
  | "expired"
  | "Awaiting Resubmission";    // Legacy — kept for backward compat
