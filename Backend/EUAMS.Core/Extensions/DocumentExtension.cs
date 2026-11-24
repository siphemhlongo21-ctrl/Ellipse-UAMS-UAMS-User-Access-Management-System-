using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Document;

namespace EUAMS.Core.Extensions
{
    public static class DocumentExtension
    {
        public static DocumentDetails ToDetails(this Document document)
        {
            return new DocumentDetails
            {
                Id = document.Id,
                Data = null,
                StorageKey = document.StorageKey,
                FileName = document.FileName,
                ContentType = document.ContentType,
                ContentLength = document.ContentLength,
                DateUploaded = document.DateUploaded,
                DateModified = document.DateModified,
                DocumentType = document.DocumentType,
                DocumentCategory = document.DocumentCategory,
                RequestId = document.RequestId,
                Active = document.IsActive,
                Archived = document.Archived,
                ArchivedDate = document.ArchivedDate
            };
        }

        public static Document ToEntity(this DocumentDetails documentDetails)
        {
            return new Document
            {
                Id = documentDetails.Id,
                Data = null,
                StorageKey = documentDetails.StorageKey,
                FileName = documentDetails.FileName,
                ContentType = documentDetails.ContentType,
                ContentLength = documentDetails.ContentLength,
                DateUploaded = DateTime.UtcNow,
                DateModified = documentDetails.DateModified,
                DocumentType = documentDetails.DocumentType,
                DocumentCategory = documentDetails.DocumentCategory,
                RequestId = documentDetails.RequestId,
                IsActive = documentDetails.Active,
                Archived = documentDetails.Archived,
                ArchivedDate = documentDetails.ArchivedDate
            };
        }

        public static List<DocumentDetails> ToListDetails(this List<Document> documents)
        {
            return documents.Select(document => document.ToDetails()).ToList();
        }
    }
}
