using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Document;
using EUAMS.Shared.DTOs.DocumentAudit;
using EUAMS.Shared.DTOs.DocumentAccess;

using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly IDocumentAccessService _documentAccessService;
        private readonly ICurrentUserService _currentUser;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            IDocumentService documentService,
            IDocumentAccessService documentAccessService,
            ICurrentUserService currentUser,
            ILogger<DocumentsController> logger)
        {
            _documentService = documentService;
            _documentAccessService = documentAccessService;
            _currentUser = currentUser;
            _logger = logger;
        }

        /// <summary>Preferred upload path — multipart form (file + metadata).</summary>
        [HttpPost]
        [RequestSizeLimit(52_428_800)]
        public async Task<ActionResult<DocumentDetails>> Upload(
            [FromForm] int requestId,
            [FromForm] string documentType,
            [FromForm] string? documentCategory,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            try
            {
                if (file is null || file.Length == 0)
                {
                    return BadRequest("A non-empty file is required.");
                }

                await using var stream = file.OpenReadStream();
                var result = await _documentService.UploadDocumentAsync(
                    requestId,
                    documentType,
                    documentCategory,
                    file.FileName,
                    file.ContentType ?? "application/octet-stream",
                    stream,
                    file.Length,
                    cancellationToken);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while uploading document.");
                throw;
            }
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.DocumentUpload)]
        public async Task<ActionResult<DocumentDetails>> CreateDocument(DocumentDetails documentDetails)
        {
            try
            {
                var result = await _documentService.CreateDocument(documentDetails);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating document.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentView)]
        public async Task<ActionResult<DocumentDetails>> GetDocumentById(int id)
        {
            try
            {
                var result = await _documentService.GetDocumentById(id);
                await LogDocumentAccessAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving document.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentView)]
        public async Task<ActionResult<List<DocumentDetails>>> GetRequestDocument(int requestId)
        {
            try
            {
                var result = await _documentService.GetRequestDocuments(requestId);
                foreach (var doc in result)
                {
                    await LogDocumentAccessAsync(doc.Id);
                }

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving request documents.");
                throw;
            }
        }
        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentUpload, PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<List<DocumentDetails>>> GetArchivedRequestDocument(int requestId)
        {
            try
            {
                var result = await _documentService.GetArchivedRequestDocuments(requestId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving archived request documents.");
                throw;
            }
        }

        [HttpPut]
        [AuthorizePermission(PermissionCodes.DocumentUpload)]
        public async Task<ActionResult<DocumentDetails>> UpdateDocument(DocumentDetails documentDetails)
        {
            try
            {
                var result = await _documentService.UpdateDocument(documentDetails);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating document.");
                throw;
            }
        }

        [HttpDelete]
        [AuthorizePermission(PermissionCodes.DocumentUpload)]
        public async Task<ActionResult<bool>> DeleteDocument(int id)
        {
            try
            {
                var result = await _documentService.DeleteDocument(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting document.");
                throw;
            }
        }

        [HttpPut]
        [AuthorizePermission(PermissionCodes.DocumentUpload, PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<bool>> ArchiveDocument(int id)
        {
            try
            {
                var result = await _documentService.ArchiveDocument(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while archiving document.");
                throw;
            }
        }
        [HttpPut]
        [AuthorizePermission(PermissionCodes.DocumentUpload, PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<bool>> RestoreDocument(int id)
        {
            try
            {
                var result = await _documentService.RestoreDocument(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while restoring document.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentView)]
        public async Task<ActionResult<List<DocumentAuditDetails>>> GetDocumentAuditTrail(int id)
        {
            try
            {
                var result = await _documentService.GetDocumentAuditTrail(id);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving document audit trail.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentDownload)]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var file = await _documentService.DownloadDocument(id);
                await LogDocumentAccessAsync(id);
                return File(file.Content, file.ContentType, file.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while downloading document.");
                throw;
            }
        }

        private async Task LogDocumentAccessAsync(int documentId)
        {
            await _currentUser.EnsureLoadedAsync();
            var accessedBy = _currentUser.ServiceNumber
                             ?? _currentUser.DisplayName
                             ?? "unknown";

            await _documentAccessService.CreateDocumentAccessAsync(new EUAMS.Shared.DTOs.DocumentAccess.DocumentAccessDetails
            {
                DocumentId = documentId,
                AccessedBy = accessedBy,
                DateAccessed = DateTime.UtcNow
            });
        }
    }
}
