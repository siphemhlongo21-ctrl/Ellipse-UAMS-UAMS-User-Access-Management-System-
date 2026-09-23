using EUAMS.Shared.DTOs.DocumentAccess;

namespace EUAMS.Shared.Interfaces
{
    public interface IDocumentAccessService
    {
        /// <summary>
        /// Creates a new document access record with the provided details.
        /// </summary>
        /// <param name="documentAccessDetails">The document access details to create.</param>
        /// <returns>The created DocumentAccessDetails object.</returns>
        Task<DocumentAccessDetails> CreateDocumentAccessAsync(DocumentAccessDetails documentAccessDetails);
    }
}
