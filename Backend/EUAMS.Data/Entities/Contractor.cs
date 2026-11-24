using EUAMS.Data.Entities.Base;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EUAMS.Data.Entities
{
    public class Contractor : Requestor
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string IdentificationNumber { get; set; }

        public string EmailAddress { get; set; }

        public string CompanyName { get; set; }

        public string ResponsibleManager { get; set; }

        public string BusinessJustification { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool Active { get; set; }

        public List<Request> Requests { get; set; } = new();

        public override string GetEmailAddress()
        {
            return EmailAddress;
        }
    }
}



