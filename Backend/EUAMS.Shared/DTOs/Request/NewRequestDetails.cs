using EUAMS.Shared.DTOs.Contractor;
using EUAMS.Shared.DTOs.Employee;

namespace EUAMS.Shared.DTOs.Request
{
    public class NewRequestDetails
    {
        public string RequestType { get; set; } = string.Empty;

        public int? EnvironmentId { get; set; }

        /// <summary>Optional name lookup when EnvironmentId is not supplied (Production/Test/Development).</summary>
        public string? Environment { get; set; }

        public string? UserAccessType { get; set; }

        public string EllipsePosition { get; set; }

        public string? PositionToCopy { get; set; }

        public string MenuAccess { get; set; } = string.Empty;

        public string BusinessJustification { get; set; } = string.Empty;

        public string AdditionalUserAccess { get; set; } = string.Empty;

        public EmployeeDetails? Employee { get; set; }

        public ContractorDetails? Contractor { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string UserType { get; set; }

        public string? EmployeeEmail { get; set; }

        /// <summary>Optional — used to provision Employee master when missing (managed create / first self request).</summary>
        public string? FirstName { get; set; }

        public string? Surname { get; set; }

        public string? ServiceNumber { get; set; }

        public string? Department { get; set; }

        public string? Branch { get; set; }

        public string? Designation { get; set; }

        /// <summary>Work phone — used when provisioning Employee master.</summary>
        public string? ContactNumber { get; set; }

        /// <summary>Active Directory / Windows ID — used when provisioning Employee master.</summary>
        public string? ActiveDirectoryUsername { get; set; }

        /// <summary>Existing Ellipse user id when known (amendment / terminate flows).</summary>
        public string? EllipseUserId { get; set; }

        public string? PostId { get; set; }

        public int? ContractId { get; set; }

        public string? TemporaryPosition { get; set; }

        public string? TemporaryPostId { get; set; }

        public string? PermanentPostId { get; set; }


        public bool Submit { get; set; } = false;
    }
}
