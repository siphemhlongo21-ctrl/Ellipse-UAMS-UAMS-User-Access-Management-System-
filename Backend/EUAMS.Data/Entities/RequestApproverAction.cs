using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class RequestApproverAction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Surname { get; set; } = string.Empty;

        public string PostId { get; set; }

        public string ActionerServiceNumber { get; set; }

        public DateTime ActionDate { get; set; }

        public int RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request Request { get; set; } = null!;

        public string ApproverRole { get; set; }

        [Required]
        public string ActionType { get; set; } = string.Empty;
    }
}
