namespace EUAMS.Shared.DTOs.Request
{
    public class ImplementRequestDetails
    {
        public string EllipseUserId { get; set; }

        public DateTime DateAccessGranted { get; set; }

        public DateTime? EllipseUserUpdateDate { get; set; }

        public string? ClosureOutcome { get; set; }

        public string ImplementationComments { get; set; } = string.Empty;

        /// <summary>HC checklist — mandatory information verified prior to implementation.</summary>
        public bool MandatoryInformationVerified { get; set; }

        /// <summary>HC checklist — contractor mandatory documents verified (Contractor subjects only).</summary>
        public bool ContractorDocumentsVerified { get; set; }
    }
}
