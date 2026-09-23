using EUAMS.API.Security;
using EUAMS.Shared.DTOs.DocumentAudit;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DocumentAuditController : ControllerBase
    {
        private readonly IDocumentAuditService _documentAuditService;
        private readonly ILogger<DocumentAuditController> _logger;

        public DocumentAuditController(
            IDocumentAuditService documentAuditService,
            ILogger<DocumentAuditController> logger)
        {
            _documentAuditService = documentAuditService;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentView, PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<DocumentAuditDetails>> GetDocumentAuditById(int id)
        {
            try
            {
                var result = await _documentAuditService.GetDocumentAuditById(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving document audit.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.DocumentView, PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<List<DocumentAuditDetails>>> GetDocumentAuditsByDocument(int documentId)
        {
            try
            {
                var result = await _documentAuditService.GetDocumentAuditsByDocument(documentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving document audits.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<List<DocumentAuditDetails>>> GetAllDocumentAudits()
        {
            try
            {
                var result = await _documentAuditService.GetAllDocumentAudits();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving all document audits.");
                throw;
            }
        }
    }
}
