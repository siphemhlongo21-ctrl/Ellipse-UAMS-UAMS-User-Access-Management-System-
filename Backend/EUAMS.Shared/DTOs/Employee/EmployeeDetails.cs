using EUAMS.Shared.DTOs.Request;

namespace EUAMS.Shared.DTOs.Employee
{
    public class EmployeeDetails
    {
        public string EmailAddress { get; set; } = string.Empty;

        public string PostId { get; set; }

        public string Surname { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string ContactNumber { get; set; } = string.Empty;

        public string ServiceNumber { get; set; } = string.Empty;

        public string Department { get; set; } = string.Empty;

        public string Branch { get; set; } = string.Empty;

        public string Designation { get; set; } = string.Empty;

        public string ActiveDirectoryUsername { get; set; } = string.Empty;

        public string ResponsibleManager { get; set; } = string.Empty;

        public List<RequestSummary> Requests { get; set; } = new();

    }
}

