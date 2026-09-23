using System.ComponentModel.DataAnnotations;

namespace EUAMS.Data.Entities
{
    public class RequestType
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(80)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
