using System.ComponentModel.DataAnnotations;

namespace EUAMS.Data.Entities
{
    public class Permission
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public List<RolePermission> RolePermissions { get; set; } = new();
        public bool Active { get; set; }
    }
}

