using EUAMS.Shared.DTOs.Request;

namespace EUAMS.Shared.DTOs.Contractor
{
    public class ContractorDetails
    {
        public int Id { get; set; }

        public string IdentificationNumber { get; set; } = string.Empty;

        public string Surname { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string EmailAddress { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string ResponsibleManager { get; set; } = string.Empty;

        public string BusinessJustification { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Department { get; set; } = string.Empty;

        public string Branch { get; set; } = string.Empty;

        public bool Active { get; set; }
        public string? ContractorName { get; set; }
        public int? ContractId { get; set; }

        /// <summary>Optional; not required when creating/updating a contractor master record.</summary>
        public List<RequestSummary>? Requests { get; set; }
    }
}
