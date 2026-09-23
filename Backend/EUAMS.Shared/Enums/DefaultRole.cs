using System.ComponentModel;

namespace EUAMS.Shared.Enums
{
    public enum DefaultRole
    {
        [Description("EMPLOYEE")]
        Employee,
        [Description("LINE_MANAGER")]
        LineManager,
        [Description("ICT_MANAGER")]
        IctManager,
        [Description("TRAINING_CENTRE")]
        TrainingCentre,
        [Description("HC_SYSTEMS_OFFICER")]
        HcSystemsOfficer,
        [Description("SYSTEM_ADMIN")]
        SystemAdmin,
    }
}
