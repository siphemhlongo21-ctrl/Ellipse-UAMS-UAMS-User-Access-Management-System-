namespace EUAMS.Shared.DTOs.Security
{
    public class AppUserSummary
    {
        public int Id { get; set; }

        public bool IsActive { get; set; } = true;

        public string ServiceNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string ActiveDirectoryUsername { get; set; } = string.Empty;

        public string? DisplayName { get; set; }

        public string? Department { get; set; }

        public List<string> Roles { get; set; } = new();

        public DateTime? LastLoginAt { get; set; }

    }
}