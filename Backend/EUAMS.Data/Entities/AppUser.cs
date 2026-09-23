using System.ComponentModel.DataAnnotations;

namespace EUAMS.Data.Entities
{
    public class AppUser
    {
        public int Id { get; set; }

        [MaxLength(256)]
        public string ActiveDirectoryUsername { get; set; } = string.Empty;

        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(256)]
        public string DisplayName { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        [MaxLength(450)]
        public string? EmployeeEmail { get; set; }

        public string ServiceNumber { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public string? CreatedBy { get; set; }

        public DateTime? LastModifiedAt { get; set; }

        public string? LastModifiedBy { get; set; }


    }
}
