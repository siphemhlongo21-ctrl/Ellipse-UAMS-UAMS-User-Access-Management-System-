using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Lookups;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    /// <summary>Admin CRUD for Department/Branch/RequestType/EllipsePosition lookups (US-031).</summary>
    [Route("api/[controller]/[action]")]
    [ApiController]
    [AuthorizePermission(PermissionCodes.AdminLookupsManage)]
    public class LookupsController : ControllerBase
    {
        private readonly ILookupsAdminService _lookups;
        private readonly ILogger<LookupsController> _logger;

        public LookupsController(ILookupsAdminService lookups, ILogger<LookupsController> logger)
        {
            _lookups = lookups;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<RequestTypeDetails>>> GetRequestTypes(CancellationToken cancellationToken)
        {
            return Ok(await _lookups.GetRequestTypesAsync(cancellationToken));
        }

        [HttpPost]
        public async Task<ActionResult<RequestTypeDetails>> CreateRequestType([FromBody] RequestTypeDetails details, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _lookups.CreateRequestTypeAsync(details, cancellationToken));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        public async Task<ActionResult<RequestTypeDetails>> UpdateRequestType([FromBody] RequestTypeDetails details, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _lookups.UpdateRequestTypeAsync(details, cancellationToken));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
