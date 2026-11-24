using EUAMS.API.Security;
using EUAMS.Shared.DTOs.RolePermission;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize]
    public class RolePermissionController : ControllerBase
    {
        private readonly IRolePermissionService _rolePermissionService;
        private readonly ILogger<RolePermissionController> _logger;

        public RolePermissionController(
            IRolePermissionService rolePermissionService,
            ILogger<RolePermissionController> logger)
        {
            _rolePermissionService = rolePermissionService;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<Dictionary<string, List<RolePermissionDetails>>>> GetRolePermissions(
            [FromQuery] string? filterString)
        {
            try
            {
                var results = await _rolePermissionService.GetRolePermissions(filterString ?? string.Empty);
                var test = results.GroupBy(o => o.RoleName).ToDictionary(o => o.Key, o => o.ToList()).ToDictionary<string, List<RolePermissionDetails>>();
                return Ok(test);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve role permissions.");
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<RolePermissionDetails>> GetRolePermission(
            int roleId,
            int permissionId)
        {
            try
            {
                var result = await _rolePermissionService
                    .GetRolePermission(roleId, permissionId);

                return result is null
                    ? NotFound()
                    : Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to retrieve role permission for RoleId {RoleId} and PermissionId {PermissionId}.",
                    roleId,
                    permissionId);

                throw;
            }
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<RolePermissionDetails>> AddRolePermission(
            [FromBody] AddRolePermissionDetails details)
        {
            try
            {
                return Ok(await _rolePermissionService.AddRolePermission(details));
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
                _logger.LogWarning(ex,
                    "Failed to add role permission for RoleId {RoleId} and PermissionId {PermissionId}.",
                    details.RoleId,
                    details.PermissionId);

                throw;
            }
        }

        [HttpDelete]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult> DeleteRolePermission(
            int roleId,
            int permissionId)
        {
            try
            {
                var deleted = await _rolePermissionService
                    .DeleteRolePermission(roleId, permissionId);

                return deleted
                    ? NoContent()
                    : NotFound();
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
                _logger.LogWarning(ex,
                    "Failed to delete role permission for RoleId {RoleId} and PermissionId {PermissionId}.",
                    roleId,
                    permissionId);

                throw;
            }
        }
    }
}