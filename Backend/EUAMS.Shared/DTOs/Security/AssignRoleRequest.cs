namespace EUAMS.Shared.DTOs.Security
{
    public class AssignRoleRequest
    {
        public int? AppUserId { get; set; }

        public string? ServiceNumber { get; set; }

        public string RoleCode { get; set; } = string.Empty;

        public DateTime? EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }
    }
}
