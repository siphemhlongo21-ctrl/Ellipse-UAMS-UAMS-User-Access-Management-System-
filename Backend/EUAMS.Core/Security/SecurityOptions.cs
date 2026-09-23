namespace EUAMS.Core.Security
{
    public class SecurityOptions
    {
        public const string SectionName = "Security";

        /// <summary>When true in Development, missing identity falls back to DevAdUsername.</summary>
        public bool UseDevIdentityFallback { get; set; } = true;

        /// <summary>
        /// When true, accept spoofable X-AD-Username (manual UI login) even outside Development.
        /// Use only on locked-down test/UAT hosts — not for public internet production.
        /// </summary>
        public bool AllowAdUsernameHeader { get; set; }

        /// <summary>AD username used for local Swagger/testing when no header/Windows identity is present.</summary>
        public string DevAdUsername { get; set; } = "DEV\\EUAMS.dev";

        /// <summary>Auto-create AppUsers on first authenticated request.</summary>
        public bool AutoProvisionUsers { get; set; } = true;

        /// <summary>AD usernames that receive SYSTEM_ADMIN (in addition to EMPLOYEE) when provisioned.</summary>
        public string[] BootstrapSystemAdminUsernames { get; set; } = ["DEV\\EUAMS.dev"];
    }
}
