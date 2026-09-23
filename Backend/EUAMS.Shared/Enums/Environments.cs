using System.ComponentModel;

namespace EUAMS.Shared.Enums
{
    public enum Environments
    {
        [Description("Production")]
        Production,
        [Description("Development")]
        Development,
        [Description("Test")]
        Test
    }
}
