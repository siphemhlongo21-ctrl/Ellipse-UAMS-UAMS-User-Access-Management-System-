namespace EUAMS.Shared.DTOs.Security
{
    public class UserRoleDetails
    {
        public string ServiceNumber { get; set; }

        public int RoleId { get; set; }

        public string RoleCode { get; set; } = string.Empty;

        public string RoleName { get; set; } = string.Empty;

        public DateTime? EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        public DateTime AssignedAt { get; set; }

        public string AssignedByServiceNumber { get; set; }
    }
}
