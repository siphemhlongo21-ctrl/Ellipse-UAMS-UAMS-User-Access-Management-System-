using System.ComponentModel;

namespace EUAMS.Shared.Enums
{
    public enum ApproverActionType
    {
        [Description("Approved")]
        Approve,
        [Description("Rejected")]
        Reject,
        [Description("Rejected Training")]
        RejectTraining,
        [Description("Implemented")]
        Implement,
        [Description("Return For Amendment")]
        ReturnForAmendment,
        [Description("Amendment Resubmit")]
        AmendmentResubmit,
        [Description("Verified")]
        TrainingVerified
    }
}