namespace EUAMS.Shared.DTOs.Security
{
    public class SetRolePermissionsRequest
    {
        public List<string> Permissions { get; set; } = new();
    }
}