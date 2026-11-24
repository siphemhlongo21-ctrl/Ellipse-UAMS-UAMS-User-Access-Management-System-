using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize]
    public class LookupUSTEmployeeController : ControllerBase
    {
        public readonly ILookupUSTEmployeeServices _lookupUSTEmployeeDetails;
        private readonly ILogger<LookupUSTEmployeeController> _logger;

        public LookupUSTEmployeeController(ILookupUSTEmployeeServices lookupUSTEmployeeDetails, ILogger<LookupUSTEmployeeController> logger)
        {
            _lookupUSTEmployeeDetails = lookupUSTEmployeeDetails;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<USTEmployeeDetails>> GetEmployee([FromQuery] string identifier)
        {
            try
            {
                return Ok(await _lookupUSTEmployeeDetails.GetEmployee(identifier));
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
                _logger.LogWarning(ex, "Failed to look up employee.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<List<USTEmployeeDetails>>> GetEmployees([FromQuery] string searchString)
        {
            try
            {
                return Ok(await _lookupUSTEmployeeDetails.GetEmployees(searchString));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (TimeoutException ex)
            {
                return StatusCode(StatusCodes.Status504GatewayTimeout, ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to search employees.");
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    "The employee directory is unavailable. Please try again.");
            }
        }

        [HttpGet]
        public Task<USTEmployeeDetails> GetEmployeeDetailsByServiceNumber(string serviceNumber)
        {
            try
            {
                return _lookupUSTEmployeeDetails.GetEmployeeDetailsByServiceNumber(serviceNumber);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving employee details from UST.");
                throw;
            }
        }

        [HttpGet]
        public Task<List<USTEmployeeDetails>> GetEmployeesReportingToManagerByManagerServiceNumber(string serviceNumber)
        {
            try
            {
                return _lookupUSTEmployeeDetails.GetEmployeesReportingToManagerByManagerServiceNumber(serviceNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while retrieving employees reporting to manager with service number {serviceNumber} from UST.");
                throw;
            }
        }
    }
}
