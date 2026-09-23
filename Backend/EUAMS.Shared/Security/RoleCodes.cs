namespace EUAMS.Shared.Security
{
    public static class RoleCodes
    {
        public const string Employee = "EMPLOYEE";
        public const string LineManager = "LINE_MANAGER";
        public const string TrainingCentre = "TRAINING_CENTRE";
        public const string IctManager = "ICT_MANAGER";
        public const string HcSystemsOfficer = "HC_SYSTEMS_OFFICER";
        public const string SystemAdmin = "SYSTEM_ADMIN";

        public const string HcSystemsAdminLegacy = "HC_SYSTEMS_ADMIN";

        public static readonly IReadOnlyList<string> SystemRoles = new[]
        {
            Employee,
            LineManager,
            TrainingCentre,
            IctManager,
            HcSystemsOfficer,
            SystemAdmin,
            HcSystemsAdminLegacy
        };

        public static bool IsSystemRole(string? roleCode)
        {
            if (string.IsNullOrWhiteSpace(roleCode))
            {
                return false;
            }

            var code = roleCode.Trim();

            return SystemRoles.Any(r => string.Equals(r, code, StringComparison.OrdinalIgnoreCase));
        }
    }
}