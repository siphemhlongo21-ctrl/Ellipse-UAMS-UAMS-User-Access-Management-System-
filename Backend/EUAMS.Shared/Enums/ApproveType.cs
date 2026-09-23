using System;

namespace EUAMS.Shared.Enums
{
    [Obsolete("Use ApproverRole instead.")]
    public enum ApproveType
    {
        LineManager = 0,
        NavigationTrainingComplete = 1,
        FundamentalsTrainingComplete = 2,
        HCSystemsAdministrator = 3,
        ICTManager = 4
    }
}
