using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    /// <summary>PDF §4.2.5 — Training Centre confirmation for Production requests.</summary>
    public class TrainingVerification
    {
        [Key]
        public int Id { get; set; }

        public int RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request Request { get; set; } = null!;

        public bool TrainingCompleted { get; set; }

        public DateTime? TrainingCompletionDate { get; set; }

        [MaxLength(200)]
        public string? VerifiedByName { get; set; }

        [MaxLength(50)]
        public string? VerifiedByServiceNumber { get; set; }

        public DateTime ActionDate { get; set; }
    }
}
