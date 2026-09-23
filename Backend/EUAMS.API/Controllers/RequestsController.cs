using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Request;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly IRequestServices _requestServices;
        private readonly ILogger<RequestsController> _logger;

        public RequestsController(IRequestServices requestServices, ILogger<RequestsController> logger)
        {
            _requestServices = requestServices;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> GetRequests()
        {
            try
            {
                return Ok(await _requestServices.GetRequests());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving requests.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
    PermissionCodes.RequestSearchAll,
    PermissionCodes.RequestViewOwn,
    PermissionCodes.RequestViewTeam,
    PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> GetAllRequests()
        {
            try
            {
                return Ok(await _requestServices.GetRequests());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving all requests.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<RequestDetails>> GetRequest(int requestId)
        {
            try
            {
                var result = await _requestServices.GetRequest(requestId);
                if (result is null)
                {
                    return NotFound();
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving request {RequestId}.", requestId);
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> SearchRequest(string searchString)
        {
            try
            {
                return Ok(await _requestServices.SearchRequest(searchString));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while searching requests.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> GetEmployeeRequestsByEmail(string email)
        {
            try
            {
                return Ok(await _requestServices.GetEmployeeRequestsByEmail(email));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving employee requests by email.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> GetEmployeeRequestsByServiceNumber(string serviceNumber)
        {
            try
            {
                return Ok(await _requestServices.GetEmployeeRequestsByServiceNumber(serviceNumber));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving employee requests by service number.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> GetLineManagerRequestsByEmail(string email)
        {
            try
            {
                return Ok(await _requestServices.GetLineManagerRequestsByEmail(email));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving line manager requests by email.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked)]
        public async Task<ActionResult<List<RequestDetails>>> GetLineManagerRequestsByServiceNumber(string serviceNumber)
        {
            try
            {
                return Ok(await _requestServices.GetLineManagerRequestsByServiceNumber(serviceNumber));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving line manager requests by service number.");
                throw;
            }
        }

        [HttpPost]
        [AuthorizePermission(
            PermissionCodes.RequestCreateSelf,
            PermissionCodes.RequestCreateManaged,
            PermissionCodes.RequestCreateServiceAccount,
            PermissionCodes.RequestTerminateInitiate)]
        public async Task<ActionResult<RequestDetails>> CreateRequest([FromBody] NewRequestDetails requestDetails)
        {
            try
            {
                var result = await _requestServices.CreateRequest(requestDetails);
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
            catch (DbUpdateException ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                _logger.LogWarning(ex, "Database error while creating a request.");
                return BadRequest($"Database error while saving the request: {detail}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while creating a request.");
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [AuthorizePermission(
            PermissionCodes.RequestCreateSelf,
            PermissionCodes.RequestCreateManaged,
            PermissionCodes.DocumentUpload)]
        public async Task<ActionResult<RequestDetails>> UpdateRequest([FromBody] RequestDetails requestDetails)
        {
            try
            {
                return Ok(await _requestServices.UpdateRequest(requestDetails));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while updating request {RequestId}.", requestDetails.Id);
                throw;
            }
        }

        [HttpPost]
        //[AuthorizePermission(PermissionCodes.RequestApproveLineManager)]
        public async Task<ActionResult<bool>> LineManagerApprove(int requestId)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.LineManagerRequestApproval(requestId),
                requestId,
                "Line Manager approve");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestApproveLineManager)]
        public async Task<ActionResult<bool>> LineManagerReject(int requestId, [FromQuery] string? rejectionReason = null)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.LineManagerRequestRejection(requestId, rejectionReason),
                requestId,
                "Line Manager reject");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestVerifyTraining)]
        public async Task<ActionResult<bool>> TrainingVerify(
            int requestId,
            [FromQuery] DateTime trainingDate,
            [FromQuery] string? verifiedBy = null)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.TrainingCenterRequestVerification(requestId, trainingDate, verifiedBy),
                requestId,
                "Training verify");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestVerifyTraining)]
        public async Task<ActionResult<bool>> TrainingUnverify(int requestId, [FromQuery] string? rejectionReason = null)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.TrainingCenterRequestUnverified(requestId, rejectionReason),
                requestId,
                "Training unverify");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<bool>> IctApprove(int requestId)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.ICTManagerRequestApproval(requestId),
                requestId,
                "ICT approve");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<bool>> IctReject(int requestId, [FromQuery] string? rejectionReason = null)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.ICTManagerRequestRejection(requestId, rejectionReason),
                requestId,
                "ICT reject");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestImplement)]
        public async Task<ActionResult<bool>> HcImplement(int requestId, [FromBody] ImplementRequestDetails details)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.HcSystemsOfficerRequestImplementation(requestId, details),
                requestId,
                "HC Systems Officer implement");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestImplement)]
        public async Task<ActionResult<bool>> HcReject(int requestId, [FromQuery] string? rejectionReason = null)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.HcSystemsOfficerRequestRejection(requestId, rejectionReason),
                requestId,
                "HC Systems Officer reject");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestReturnForAmendment)]
        public async Task<ActionResult<bool>> ReturnForAmendment(
            int requestId,
            [FromBody] ReturnForAmendmentDetails details)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.ReturnForAmendment(requestId, details),
                requestId,
                "Return for amendment");
        }

        [HttpPost]
        public async Task<ActionResult<bool>> ResubmitAmendment(int requestId)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.ResubmitAmendment(requestId),
                requestId,
                "Resubmit amendment");
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestCancel)]
        public async Task<ActionResult<bool>> Cancel(int requestId)
        {
            return await ExecuteWorkflowAsync(
                () => _requestServices.CancelRequest(requestId),
                requestId,
                "Cancel");
        }

        private async Task<ActionResult<bool>> ExecuteWorkflowAsync(
            Func<Task<bool>> action,
            int requestId,
            string operation)
        {
            try
            {
                return Ok(await action());
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred during {Operation} for request {RequestId}.", operation, requestId);
                throw;
            }
        }

        [HttpGet]
        //[AuthorizePermission(PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<List<RequestDetails>>> GetICTManagerRequests()
        {
            try
            {
                return Ok(await _requestServices.GetICTManagerRequestsAsync());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "An error occurred while retrieving ICT Manager requests.");

                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.RequestVerifyTraining)]
        public async Task<ActionResult<List<RequestDetails>>> GetTrainingCenterRequests()
        {
            try
            {
                return Ok(await _requestServices.GetTrainingCenterRequestsAsync());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "An error occurred while retrieving Training Center requests.");

                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.RequestImplement)]
        public async Task<ActionResult<List<RequestDetails>>> GetHcSystemsOfficerRequests()
        {
            try
            {
                return Ok(await _requestServices.GetHcSystemsOfficerRequestsAsync());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "An error occurred while retrieving HC Systems Officer requests.");

                throw;
            }
        }
    }
}
