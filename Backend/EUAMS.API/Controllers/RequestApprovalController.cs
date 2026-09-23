using EUAMS.API.Security;
using EUAMS.Shared.DTOs.RequestApproverAction;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RequestApprovalController : ControllerBase
    {
        private readonly IRequestApproverActionService _requestApproverActionService;
        private readonly ILogger<RequestApprovalController> _logger;

        public RequestApprovalController(
            IRequestApproverActionService requestApproverActionService,
            ILogger<RequestApprovalController> logger)
        {
            _requestApproverActionService = requestApproverActionService;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestViewLinked,
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewOwn)]
        public async Task<ActionResult<List<RequestApproverActionDetails>>> GetApprovalsForRequest(int requestId)
        {
            try
            {
                var result = await _requestApproverActionService.GetApproverActionForRequestAsync(requestId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving request approvals.");
                throw;
            }
        }
    }
}
