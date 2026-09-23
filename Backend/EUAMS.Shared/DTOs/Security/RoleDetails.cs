namespace EUAMS.Shared.DTOs.Security
{
    public class RoleDetails
    {
        public int Id { get; set; }

        public string Code { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public bool IsSystemRole { get; set; }

        public int AssignedUserCount { get; set; }

        public DateTime CreatedAt { get; set; }

        public string? CreatedBy { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public string? ModifiedBy { get; set; }

        public List<string> Permissions { get; set; } = new();
    }
}