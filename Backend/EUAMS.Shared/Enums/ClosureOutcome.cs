using System.ComponentModel;

namespace EUAMS.Shared.Enums
{
    public enum ClosureOutcome
    {
        [Description("Rejected By Line Manager")]
        RejectedByLineManager,
        [Description("Rejected By Ict Manager")]
        RejectedByIctManager,
        [Description("Training Unverified By Training Centre")]
        RejectedByTrainingCentre,
        [Description("Implemented By Hc Systems Officer")]
        Implemented,
        [Description("Rejected By Hc Systems Officer")]
        RejectedByHcSystemsOfficer,
        [Description("Cancelled")]
        Cancelled
    }
}
