using EUAMS.Core.Extensions;
using EUAMS.Core.Security;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Document;
using EUAMS.Shared.DTOs.DocumentAudit;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Services
{
    public class DocumentServices : IDocumentService
    {
        private readonly EuamsDbContext _context;
        private readonly IRequestAccessService _access;
        //private readonly IObjectStorage _storage;
        private readonly ICurrentUserService _currentUser;

        public DocumentServices(
            EuamsDbContext context,
            IRequestAccessService access,
            //IObjectStorage storage,
            ICurrentUserService currentUser)
        {
            _context = context;
            _access = access;
            //_storage = storage;
            _currentUser = currentUser;
        }

        public async Task<DocumentDetails> CreateDocument(DocumentDetails documentDetails)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadRequestAsync(documentDetails.RequestId);
            _access.EnsureCanUpload(request);

            if (documentDetails.Data is null || documentDetails.Data.Length == 0)
            {
                throw new ArgumentException("Data is required for JSON create. Prefer multipart Upload.");
            }

            await using var stream = new MemoryStream(documentDetails.Data);
            return await PersistNewDocumentAsync(
                documentDetails.RequestId,
                documentDetails.DocumentType,
                documentDetails.DocumentCategory,
                documentDetails.FileName ?? $"document-{Guid.NewGuid():N}.bin",
                documentDetails.ContentType ?? "application/octet-stream",
                stream,
                documentDetails.Data.Length);
        }

        public async Task<DocumentDetails> UploadDocumentAsync(
            int requestId,
            string documentType,
            string? documentCategory,
            string fileName,
            string contentType,
            Stream content,
            long contentLength,
            CancellationToken cancellationToken = default)
        {
            await _access.EnsureLoadedAsync(cancellationToken);
            var request = await LoadRequestAsync(requestId);
            _access.EnsureCanUpload(request);

            if (string.IsNullOrWhiteSpace(documentType))
            {
                throw new ArgumentException("DocumentType is required.");
            }

            if (contentLength <= 0)
            {
                throw new ArgumentException("Empty files are not allowed.");
            }

            return await PersistNewDocumentAsync(
                requestId,
                documentType.Trim(),
                documentCategory,
                fileName,
                contentType,
                content,
                contentLength,
                cancellationToken);
        }

        public async Task<DocumentDetails> GetDocumentById(int documentId)
        {
            await _access.EnsureLoadedAsync();
            var document = await _context.Documents.AsNoTracking().FirstOrDefaultAsync(d => d.Id == documentId)
                ?? throw new KeyNotFoundException($"Document with ID {documentId} not found");

            var request = await LoadRequestAsync(document.RequestId);
            return document.ToDetails();
        }

        public async Task<List<DocumentDetails>> GetRequestDocuments(int requestId)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadRequestAsync(requestId);

            var documents = await _context.Documents.AsNoTracking()
                .Where(d => d.RequestId == requestId && d.IsActive && !d.Archived)
                .ToListAsync();

            return documents.ToListDetails();
        }
        
        public async Task<List<DocumentDetails>> GetArchivedRequestDocuments(int requestId)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadRequestAsync(requestId);

            var documents = await _context.Documents.AsNoTracking()
                .Where(d => d.RequestId == requestId && d.IsActive && d.Archived)
                .ToListAsync();

            return documents.ToListDetails();
        }

        public async Task<DocumentDetails> UpdateDocument(DocumentDetails documentDetails)
        {
            await _access.EnsureLoadedAsync();
            var document = await _context.Documents.FindAsync(documentDetails.Id)
                ?? throw new KeyNotFoundException($"Document with ID {documentDetails.Id} not found");

            var request = await LoadRequestAsync(document.RequestId);
            _access.EnsureCanUpload(request);

            document.DocumentType = documentDetails.DocumentType;
            document.DocumentCategory = documentDetails.DocumentCategory;
            document.DateModified = DateTime.UtcNow;

            if (documentDetails.Data is { Length: > 0 })
            {
                var oldKey = document.StorageKey;
                var fileName = documentDetails.FileName
                               ?? document.FileName
                               ?? $"document-{document.Id}.bin";
                var contentType = documentDetails.ContentType
                                  ?? document.ContentType
                                  ?? "application/octet-stream";
                var key = BuildStorageKey(document.RequestId, document.Id, fileName);

                await using var stream = new MemoryStream(documentDetails.Data);
                //await _storage.PutAsync(key, stream, contentType, documentDetails.Data.Length);

                document.StorageKey = key;
                document.FileName = SanitizeFileName(fileName);
                document.ContentType = contentType;
                document.ContentLength = documentDetails.Data.Length;
                document.Data = null;

                if (!string.IsNullOrWhiteSpace(oldKey) && !string.Equals(oldKey, key, StringComparison.Ordinal))
                {
                    //await _storage.DeleteAsync(oldKey);
                }
            }

            await _context.SaveChangesAsync();
            return document.ToDetails();
        }

        public async Task<bool> DeleteDocument(int documentId)
        {
            await _access.EnsureLoadedAsync();
            var document = await _context.Documents.FindAsync(documentId);
            if (document is null)
            {
                return false;
            }

            var request = await LoadRequestAsync(document.RequestId);
            _access.EnsureCanUpload(request);

            document.IsActive = false;
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(document.StorageKey))
            {
                //await _storage.DeleteAsync(document.StorageKey);
            }

            return true;
        }

        public async Task<bool> ArchiveDocument(int documentId)
        {
            await _access.EnsureLoadedAsync();
            var entity = await _context.Documents.FindAsync(documentId);
            if (entity is null)
            {
                return false;
            }

            var request = await LoadRequestAsync(entity.RequestId);
            _access.EnsureNotClosed(request);

            if (entity.Archived)
            {
                return true;
            }

            entity.Archived = true;
            entity.ArchivedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await LogDocumentAuditAsync(documentId, "Archived");
            return true;
        }

        public async Task<bool> RestoreDocument(int documentId)
        {
            await _access.EnsureLoadedAsync();
            var entity = await _context.Documents.FindAsync(documentId);
            if (entity is null)
            {
                return false;
            }

            var request = await LoadRequestAsync(entity.RequestId);
            _access.EnsureNotClosed(request);

            if (!entity.Archived)
            {
                return true;
            }

            entity.Archived = false;
            entity.ArchivedDate = null;
            await _context.SaveChangesAsync();

            await LogDocumentAuditAsync(documentId, "Restored");
            return true;
        }

        public async Task<List<DocumentAuditDetails>> GetDocumentAuditTrail(int documentId)
        {
            await _access.EnsureLoadedAsync();
            var entity = await _context.Documents.AsNoTracking().FirstOrDefaultAsync(d => d.Id == documentId)
                ?? throw new KeyNotFoundException($"Document with ID {documentId} not found");

            await LoadRequestAsync(entity.RequestId);

            var audits = await _context.DocumentAudits.AsNoTracking()
                .Where(a => a.DocumentId == documentId)
                .OrderByDescending(a => a.DateCreated)
                .ToListAsync();

            return audits.ToListDetails();
        }

        private async Task LogDocumentAuditAsync(int documentId, string auditType)
        {
            _context.DocumentAudits.Add(new DocumentAudit
            {
                DocumentId = documentId,
                DateCreated = DateTime.UtcNow,
                AuditType = auditType
            });
            await _context.SaveChangesAsync();
        }

        public async Task<DocumentDownloadResult> DownloadDocument(int documentId)
        {
            await _access.EnsureLoadedAsync();
            var entity = await _context.Documents.AsNoTracking().FirstOrDefaultAsync(d => d.Id == documentId)
                ?? throw new KeyNotFoundException($"Document with ID {documentId} not found");

            var request = await LoadRequestAsync(entity.RequestId);

            return new DocumentDownloadResult
            {
                Content = entity.Data,
                ContentType = string.IsNullOrWhiteSpace(entity.ContentType)
                    ? "application/octet-stream"
                    : entity.ContentType,
                FileName = string.IsNullOrWhiteSpace(entity.FileName)
                    ? $"Document_{documentId}"
                    : entity.FileName
            };
        }

        private async Task<DocumentDetails> PersistNewDocumentAsync(
            int requestId,
            string documentType,
            string? documentCategory,
            string fileName,
            string contentType,
            Stream content,
            long contentLength,
            CancellationToken cancellationToken = default)
        {
            var safeName = SanitizeFileName(fileName);
            await _currentUser.EnsureLoadedAsync(cancellationToken);
            byte[]? data = null;

            using (var ms = new MemoryStream())
            {
                content.CopyTo(ms);
                data = ms.ToArray();
            }

            var document = new Document
            {
                RequestId = requestId,
                DocumentType = documentType,
                DocumentCategory = documentCategory,
                FileName = safeName,
                ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
                ContentLength = contentLength,
                DateUploaded = DateTime.UtcNow,
                IsActive = true,
                Data = data,
                UploadedByServiceNumber = _currentUser.ServiceNumber,
                RetentionExpiryDate = DateTime.UtcNow.AddYears(7)
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync(cancellationToken);

            var key = BuildStorageKey(requestId, document.Id, safeName);
            //await _storage.PutAsync(key, content, document.ContentType!, contentLength, cancellationToken);

            document.StorageKey = key;
            await _context.SaveChangesAsync(cancellationToken);

            return document.ToDetails();
        }

        private static string BuildStorageKey(int requestId, int documentId, string fileName) =>
            $"requests/{requestId}/{documentId}/{SanitizeFileName(fileName)}";

        private static string SanitizeFileName(string fileName)
        {
            var name = Path.GetFileName(string.IsNullOrWhiteSpace(fileName) ? "document.bin" : fileName.Trim());
            foreach (var c in Path.GetInvalidFileNameChars())
            {
                name = name.Replace(c, '_');
            }

            return string.IsNullOrWhiteSpace(name) ? "document.bin" : name;
        }

        private async Task<Request> LoadRequestAsync(int requestId)
        {
            var request = await _context.Requests
                .FirstOrDefaultAsync(r => r.Id == requestId)
                ?? throw new KeyNotFoundException($"Request {requestId} was not found.");

            return request;
        }
    }
}
