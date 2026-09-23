using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class DocumentResubmissionRequest
    {
        [Key]
        public int Id { get; set; }

        public int RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request Request { get; set; } = null!;

        public string RequestedByServiceNumber { get; set; }

        [Required]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public string DocumentsRequested { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Open";

        public DateTime RequestedAt { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}
