using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class AppNotification
    {
        [Key]
        public long Id { get; set; }


        public int? RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request? Request { get; set; }

        [MaxLength(64)]
        public string Category { get; set; } = "Request";

        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Body { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }
        public string ServiceNumber { get; set; } = string.Empty;
    }
}
