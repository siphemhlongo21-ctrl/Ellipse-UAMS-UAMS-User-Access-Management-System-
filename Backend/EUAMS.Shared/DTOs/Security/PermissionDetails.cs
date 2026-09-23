namespace EUAMS.Shared.DTOs.Security
{
    public class PermissionDetails
    {
        public int Id { get; set; }

        public string Code { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Group { get; set; } = string.Empty;
    }
}