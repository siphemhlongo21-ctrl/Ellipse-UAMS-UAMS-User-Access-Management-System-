using EUAMS.Shared.DTOs.Contractor;
using EUAMS.Shared.Enums;

namespace EUAMS.Shared.DTOs.Request
{
    public class RequestDetails
    {
        public int Id { get; set; }

        public string? RequestNumber { get; set; }

        public string Status { get; set; } = RequestStatus.Draft.ToString();

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public DateTime RequestedDate { get; set; }

        public string RequestType { get; set; } = string.Empty;

        public string? Environment { get; set; }

        public string? UserAccessType { get; set; }

        public string EllipsePosition { get; set; } = string.Empty;

        public string? PositionToCopy { get; set; }

        public string MenuAccess { get; set; } = string.Empty;

        public string BusinessJustification { get; set; } = string.Empty;

        public string AdditionalUserAccess { get; set; } = string.Empty;

        public string UserType { get; set; } = string.Empty;

        public string? EmployeeEmail { get; set; }

        /// <summary>Search/display enrichment — pulled from Employee or Contractor master records.</summary>
        public string? Department { get; set; }

        public string? Branch { get; set; }

        public string? ServiceNumber { get; set; }
        public string? Designation { get; set; }

        public string? ActiveDirectoryUsername { get; set; }

        public string? EmployeeName { get; set; }

        public string? ContractorName { get; set; }

        public string? CompanyName { get; set; }

        public int? ContractId { get; set; }

        public string? EllipseUserId { get; set; }

        public string? TemporaryPosition { get; set; }

        public string? TemporaryPostId { get; set; }

        public string? PermanentPostId { get; set; }

        public bool? LineManagerApproved { get; set; }

        public bool? DeputyHeadApproved { get; set; }

        public bool? TrainingVerified { get; set; }

        public bool? ICTManagerApproved { get; set; }

        public bool? HCSystemsAdminApproved { get; set; }

        /// <summary>HC checklist — mandatory information verified prior to implementation.</summary>
        public bool? MandatoryInformationVerified { get; set; }

        /// <summary>HC checklist — contractor mandatory documents verified (Contractor subjects only).</summary>
        public bool? ContractorDocumentsVerified { get; set; }

        public string? RejectionReason { get; set; }

        /// <summary>True when HC returned the request because documents were missing.</summary>
        public bool? MissingDocuments { get; set; }

        /// <summary>Open amendment reason (from DocumentResubmissionRequests when Status is ReturnForAmendment).</summary>
        public string? AmendmentReason { get; set; }

        /// <summary>Documents HC asked to be re-supplied for the open amendment.</summary>
        public string? DocumentsRequested { get; set; }

        public DateTime? DateAccessGranted { get; set; }

        public DateTime? EllipseUserUpdateDate { get; set; }

        public string? ClosureOutcome { get; set; }

        public string? ImplementationComments { get; set; }

        public string? SubmittedByServiceNumber { get; set; }

        public ContractorDetails? Contractor { get; set; }

        public List<string>? DocumentResubmissionRequests {  get; set; }

	}
}
