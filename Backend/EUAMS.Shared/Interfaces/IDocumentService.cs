using EUAMS.Shared.DTOs.Document;

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

        Task<DocumentDetails> UpdateDocument(DocumentDetails documentDetails);

        Task<bool> DeleteDocument(int documentId);

        Task<bool> ArchiveDocument(int documentId);
        Task<int> ArchiveAllExpiredDocumentsAsync(CancellationToken cancellationToken = default);

        Task<DocumentDownloadResult> DownloadDocument(int documentId);
    }
}
