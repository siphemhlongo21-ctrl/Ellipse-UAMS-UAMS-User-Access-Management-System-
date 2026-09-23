using System.ComponentModel.DataAnnotations;

namespace EUAMS.Data.Entities
{
    public class Role
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        [MaxLength(256)]
        public string? CreatedBy { get; set; }

        public DateTime? ModifiedAt { get; set; }

        [MaxLength(256)]
        public string? ModifiedBy { get; set; }

        public List<RolePermission> RolePermissions { get; set; } = new();

        public List<UserRole> UserRoles { get; set; } = new();
    }
}