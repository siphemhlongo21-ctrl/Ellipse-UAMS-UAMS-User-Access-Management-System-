using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class UserRole
    {
        [Key]
        public int Id { get; set; }
        public string ServiceNumber { get; set; }

        public int RoleId { get; set; }

        [ForeignKey(nameof(RoleId))]
        public Role Role { get; set; } = null!;

        public DateTime AssignedAt { get; set; }

        public DateTime? EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        public string AssignedByServiceNumber { get; set; }
    }
}