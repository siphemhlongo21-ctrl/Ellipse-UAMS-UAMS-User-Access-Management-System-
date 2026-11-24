using EUAMS.Data.Entities.Base;
using System.ComponentModel.DataAnnotations;

namespace EUAMS.Data.Entities
{
    public class Employee : Requestor
    {
        [Key]
        public new string EmailAddress { get; set; } = string.Empty;

        public string PostId { get; set; }

        public string ContactNumber { get; set; } = string.Empty;

        public string ServiceNumber { get; set; } = string.Empty;

        public string Designation { get; set; } = string.Empty;

        public string ActiveDirectoryUsername { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public List<Request> Requests { get; set; } = new();

        public override string GetEmailAddress()
        {
            return EmailAddress;
        }
    }
}
