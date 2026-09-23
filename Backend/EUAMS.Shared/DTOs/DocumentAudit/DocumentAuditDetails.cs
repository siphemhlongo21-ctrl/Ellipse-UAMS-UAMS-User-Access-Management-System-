namespace EUAMS.Shared.DTOs.DocumentAudit
{
    public class DocumentAuditDetails
    {
        public int Id { get; set; }

        public int DocumentId { get; set; }

        public DateTime DateCreated { get; set; }

        public string AuditType { get; set; } = string.Empty;
    }
}