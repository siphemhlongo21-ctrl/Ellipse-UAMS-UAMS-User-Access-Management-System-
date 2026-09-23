using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class Document
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>Legacy SQL binary. New uploads store null and use <see cref="StorageKey"/>.</summary>
        public byte[]? Data { get; set; }

        [MaxLength(512)]
        public string? StorageKey { get; set; }

        [MaxLength(260)]
        public string? FileName { get; set; }

        [MaxLength(128)]
        public string? ContentType { get; set; }

        public long? ContentLength { get; set; }

        public DateTime DateUploaded { get; set; }

        public DateTime? DateModified { get; set; }

        [Required]
        public string DocumentType { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? DocumentCategory { get; set; }

        public int RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request Request { get; set; } = null!;

        /// <summary>Mapped to DB column Active (legacy name).</summary>
        [Column("Active")]
        public bool IsActive { get; set; }

        public bool Archived { get; set; }

        public DateTime? ArchivedDate { get; set; }

        public string UploadedByServiceNumber { get; set; }

        public DateTime? RetentionExpiryDate { get; set; }
    }
}
