using System.ComponentModel;

namespace EUAMS.Shared.Enums
{
    public enum RequestStatus
    {
        Draft = 1,
        [Description("Awaiting Line Manager Approval")]
        PendingApproval = 2,
        [Description("Training Verification Pending")]
        TrainingVerificationPending = 3,
        [Description("ICT Manager Approval Pending")]
        ICTManagerApprovalPending = 4,
        [Description("Implemented")]
        Implemented = 5,
        [Description("Rejected")]
        Rejected = 6,
        [Description("Awaiting Resubmission")]
        ReturnForAmendment = 7,
        Cancelled = 8,
        /// <summary>Awaiting HC Systems Officer verification / Ellipse action / close.</summary>
        [Description("Hc Systems Officer Implementation Pending")]
        HcActionPending = 9
    }
}
