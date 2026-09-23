using System.ComponentModel;

namespace EUAMS.Shared.Enums
{
    public enum UserType
    {
        [Description("Employee")]
        Employee = 1,
        [Description("Contractor")]
        Contractor = 2
    }
}
