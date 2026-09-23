namespace EUAMS.Shared.DTOs.RolePermission
{
    public class RolePermissionDetails
    {
        public int RoleId { get; set; }
        public int PermissionId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string PermissionName { get; set; } = string.Empty;
    }
}

