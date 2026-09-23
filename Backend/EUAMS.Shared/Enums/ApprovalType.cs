using System;

namespace EUAMS.Shared.Enums
{
    [Obsolete("Use ApproverRole instead.")]
    public enum ApprovalType
    {
        LineManager = 1,
        NavigationTrainingComplete = 2,
        FundamentalsTrainingComplete = 3,
        HCSystemsAdministrator = 4,
        ICTManager = 5
    }
}
