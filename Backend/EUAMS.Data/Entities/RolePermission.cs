using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class RolePermission
    {
        public int RoleId { get; set; }

        [ForeignKey(nameof(RoleId))]
        public Role Role { get; set; } = null!;

        public int PermissionId { get; set; }

        [ForeignKey(nameof(PermissionId))]
        public Permission Permission { get; set; } = null!;

        public bool IsDeleted { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}