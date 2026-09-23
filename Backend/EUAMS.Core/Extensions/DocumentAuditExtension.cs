using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.DocumentAudit;

namespace EUAMS.Core.Extensions
{
    public static class DocumentAuditExtensions
    {
        public static DocumentAuditDetails ToDetails(this DocumentAudit documentAudit)
        {
            return new DocumentAuditDetails
            {
                Id = documentAudit.Id,
                DocumentId = documentAudit.DocumentId,
                DateCreated = documentAudit.DateCreated,
                AuditType = documentAudit.AuditType
            };
        }

        public static DocumentAudit ToEntity(this DocumentAuditDetails documentAuditDetails)
        {
            return new DocumentAudit
            {
                Id = documentAuditDetails.Id,
                DocumentId = documentAuditDetails.DocumentId,
                DateCreated = documentAuditDetails.DateCreated,
                AuditType = documentAuditDetails.AuditType,
            };
        }

        public static List<DocumentAuditDetails> ToListDetails(this List<DocumentAudit> documentAudits)
        {
            return documentAudits.Select(o => o.ToDetails()).ToList();
        }
    }
}
