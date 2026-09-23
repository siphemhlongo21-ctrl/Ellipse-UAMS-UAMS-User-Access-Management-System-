using EUAMS.Shared.DTOs.Document;
using EUAMS.Shared.DTOs.DocumentAudit;

namespace EUAMS.Shared.Interfaces
{
    public interface IDocumentService
    {
        Task<DocumentDetails> CreateDocument(DocumentDetails documentDetails);

        Task<DocumentDetails> UploadDocumentAsync(
            int requestId,
            string documentType,
            string? documentCategory,
            string fileName,
            string contentType,
            Stream content,
            long contentLength,
            CancellationToken cancellationToken = default);

        Task<DocumentDetails> GetDocumentById(int documentId);

        Task<List<DocumentDetails>> GetRequestDocuments(int requestId);

        // --- NEW ADDITIONS START HERE ---
        Task<List<DocumentDetails>> GetArchivedRequestDocuments(int requestId);
        Task<bool> RestoreDocument(int documentId);
        Task<List<DocumentAuditDetails>> GetDocumentAuditTrail(int documentId);
        // --- NEW ADDITIONS END HERE ---

        Task<DocumentDetails> UpdateDocument(DocumentDetails documentDetails);

        Task<bool> DeleteDocument(int documentId);

        Task<bool> ArchiveDocument(int documentId);

        Task<DocumentDownloadResult> DownloadDocument(int documentId);
    }
}