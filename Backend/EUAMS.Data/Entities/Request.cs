using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class Request
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Status { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public DateTime RequestedDate { get; set; }

        public string? EllipseUserId { get; set; }

        public string EllipsePosition { get; set; } = string.Empty;

        public string MenuAccess { get; set; } = string.Empty;

        public string BusinessJustification { get; set; } = string.Empty;

        [Required]
        public string RequestType { get; set; } = string.Empty;

        /// <summary>Deprecated: use <see cref="EnvironmentId"/>. Kept for backfill compatibility.</summary>
        [StringLength(50)]
        public string? Environment { get; set; }


        [StringLength(50)]
        public string? UserAccessType { get; set; }

        [Required]
        [StringLength(50)]
        public string AdditionalUserAccess { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string UserType { get; set; } = string.Empty;

        public List<Document> Documents { get; set; } = new();

        public int? ContractId { get; set; }

        [ForeignKey(nameof(ContractId))]
        public Contractor? Contractor { get; set; }

        public string? EmployeeEmail { get; set; }

        [ForeignKey(nameof(EmployeeEmail))]
        public Employee? Employee { get; set; }

        public string? TemporaryPosition { get; set; }

        public string? TemporaryPostId { get; set; }

        public string? PermanentPostId { get; set; }

        public string? PositionToCopy { get; set; }

        public bool? MissingDocuments { get; set; }

        public bool? LineManagerApproved { get; set; }

        public bool? DeputyHeadApproved { get; set; }

        public bool? TrainingVerified { get; set; }

        public bool? ICTManagerApproved { get; set; }

        public bool? HCSystemsAdminApproved { get; set; }

        /// <summary>HC checklist — mandatory information verified prior to implementation.</summary>
        public bool MandatoryInformationVerified { get; set; }

        /// <summary>HC checklist — contractor mandatory documents verified (Contractor subjects only).</summary>
        public bool ContractorDocumentsVerified { get; set; }

        public DateTime? TrainingCompletionDate { get; set; }

        public bool? RequestClosed { get; set; }

        public string? HcSystemOfficerApprovalServiceNumber { get; set; }

        public string? LineManagerApprovalServiceNumber { get; set; }

        public string? DeputyHeadApprovalServiceNumber { get; set; }

        public string? TrainingApprovalServiceNumber { get; set; }

        public string? ICTManagerApprovalServiceNumber { get; set; }

        public string? RequestNumber { get; set; }

        public string? ClosureOutcome { get; set; }

        public DateTime? EllipseUserUpdateDate { get; set; }

        public string SubmittedByServiceNumber { get; set; }

        public string? ImplementedByServiceNumber { get; set; }

        public DateTime? DateAccessGranted { get; set; }

        public string? ImplementationComments { get; set; }

        public string? RejectionReason { get; set; }

        public string? CancelledByServiceNumber { get; set; }

        public DateTime? CancelledAt { get; set; }

        public List<RequestApproverAction> ApproverActions { get; set; } = new();

        public List<RequestStatusHistory> StatusHistory { get; set; } = new();

        public List<DocumentResubmissionRequest> DocumentResubmissionRequests { get; set; } = new();
    }
}

