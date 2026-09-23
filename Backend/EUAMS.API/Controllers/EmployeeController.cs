using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeServices _employeeServices;
        private readonly ILogger<EmployeeController> _logger;

        public EmployeeController(
            IEmployeeServices employeeService,
            ILogger<EmployeeController> logger)
        {
            _employeeServices = employeeService;
            _logger = logger;
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.RequestSearchAll, PermissionCodes.AdminLookupsManage)]
        public async Task<ActionResult<EmployeeDetails>> CreateEmployeeAsync(EmployeeDetails employeeDetails)
        {
            try
            {
                var result = await _employeeServices.CreateEmployeeAsync(employeeDetails);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occured while creating employee.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestSearchAll)]
        public async Task<ActionResult> GetEmployeeByIdAsync(string email)
        {
            try
            {
                var result = await _employeeServices.GetEmployeeByIdAsync(email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occured while retrieving employee email.");
                throw;
            }
        }

        [HttpPut]
        [AuthorizePermission(PermissionCodes.RequestSearchAll, PermissionCodes.AdminLookupsManage)]
        public async Task<ActionResult> UpdateEmployeeAsync(EmployeeDetails employeeDetails)
        {
            try
            {
                var result = await _employeeServices.UpdateEmployeeAsync(employeeDetails);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occured while updating employee.");
                throw;
            }
        }

        [HttpDelete]
        [AuthorizePermission(PermissionCodes.RequestSearchAll, PermissionCodes.AdminLookupsManage)]
        public async Task<ActionResult> DeleteEmployeeAsync(string email)
        {
            try
            {
                var result = await _employeeServices.DeleteEmployeeAsync(email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occured while deleting an employee.");
                throw;
            }
        }
    }
}
