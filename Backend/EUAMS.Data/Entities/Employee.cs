using System.ComponentModel.DataAnnotations;

namespace EUAMS.Data.Entities
{
    public class Employee
    {
        [Key]
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

        public bool IsActive { get; set; }

        public List<Request> Requests { get; set; } = new();
    }
}
