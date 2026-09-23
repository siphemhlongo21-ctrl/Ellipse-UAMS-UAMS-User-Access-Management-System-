using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Contractor;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContractorController : ControllerBase
    {
        private readonly IContractorServices _contractorServices;
        private readonly ILogger<ContractorController> _logger;

        public ContractorController(
            IContractorServices contractorServices,
            ILogger<ContractorController> logger)
        {
            _contractorServices = contractorServices;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestCreateManaged,
            PermissionCodes.RequestSearchAll,
            PermissionCodes.AdminLookupsManage,
            PermissionCodes.RequestViewTeam)]
        public async Task<ActionResult<List<ContractorDetails>>> GetActiveContractors()
        {
            try
            {
                var result = await _contractorServices.GetActiveContractorsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving active contractors.");
                throw;
            }
        }

        [HttpPost]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.AdminLookupsManage,
            PermissionCodes.RequestCreateManaged)]
        public async Task<ActionResult> CreateContractor([FromBody] ContractorDetails contractorDetails)
        {
            try
            {
                var result = await _contractorServices.CreateContractorAsync(contractorDetails);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while creating contractor.");
                throw;
            }
        }

        [HttpGet("{id}")]
        [AuthorizePermission(
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult<ContractorDetails>> GetContractorById(int id)
        {
            try
            {
                var contractor = await _contractorServices.GetContractorByIdAsync(id);

                if (contractor == null)
                {
                    return NotFound();
                }

                return Ok(contractor);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while retrieving contractor.");
                throw;
            }
        }

        [HttpPut]
        [AuthorizePermission(
            PermissionCodes.RequestSearchAll,
            PermissionCodes.AdminLookupsManage,
            PermissionCodes.RequestCreateManaged)]
        public async Task<ActionResult> UpdateContractor([FromBody] ContractorDetails contractorDetails)
        {
            try
            {
                var result = await _contractorServices.UpdateContractorAsync(contractorDetails);

                if (result == null)
                {
                    return NotFound();
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while updating contractor.");
                throw;
            }
        }

        [HttpDelete("{id}")]
        [AuthorizePermission(PermissionCodes.RequestSearchAll, PermissionCodes.AdminLookupsManage)]
        public async Task<ActionResult> DeleteContractor(int id)
        {
            try
            {
                var result = await _contractorServices.DeleteContractorAsync(id);

                if (!result)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while deleting contractor.");
                throw;
            }
        }
    }
}
