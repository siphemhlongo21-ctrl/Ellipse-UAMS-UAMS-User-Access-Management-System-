using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class RequestStatusHistory
    {
        [Key]
        public int Id { get; set; }

        public int RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request Request { get; set; } = null!;

        public string? FromStatus { get; set; }

        public string ToStatus { get; set; }

        [Required]
        [MaxLength(50)]
        public string Event { get; set; } = string.Empty;

        public string? Reason { get; set; }

        public string ChangedByServiceNumber { get; set; }

        public DateTime ChangedAt { get; set; }
    }
}
