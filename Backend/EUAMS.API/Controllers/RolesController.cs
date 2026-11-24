using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Security;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly IRoleAdminService _roleAdminService;
        private readonly ILogger<RolesController> _logger;

        public RolesController(IRoleAdminService roleAdminService, ILogger<RolesController> logger)
        {
            _roleAdminService = roleAdminService;
            _logger = logger;
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign, PermissionCodes.AdminLookupsManage)]
        public async Task<ActionResult<List<RoleDetails>>> GetRoles(
            [FromQuery] bool includeInactive = false,
            [FromQuery] string? filterString = null)
        {
            try
            {
                var roles = await _roleAdminService.GetRolesAsync(filterString, includeInactive);
                
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to list roles.");
                throw;
            }
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<RoleDetails>> CreateRole([FromBody] CreateRoleRequest request)
        {
            try
            {
                return Ok(await _roleAdminService.CreateRoleAsync(request));
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
                _logger.LogWarning(ex, "Failed to create role {RoleCode}.", request.Code);
                throw;
            }
        }

        [HttpDelete("{id:int}")]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult> DeleteRole([FromRoute] int id)
        {
            try
            {
                var removed = await _roleAdminService.DeleteRoleAsync(id);
                return removed ? NoContent() : NotFound();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete role {RoleId}.", id);
                throw;
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign, PermissionCodes.AdminLookupsManage)]
        public async Task<ActionResult<RoleDetails>> GetRole([FromQuery] int roleId)
        {
            try
            {
                var role = await _roleAdminService.GetRoleAsync(roleId);
                return role is null ? NotFound() : Ok(role);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get role {RoleId}.", roleId);
                return BadRequest(ex.Message);
            }
        }


        [HttpPut]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<RoleDetails>> UpdateRole(
            [FromQuery] int roleId,
            [FromBody] UpdateRoleRequest request)
        {
            try
            {
                return Ok(await _roleAdminService.UpdateRoleAsync(roleId, request));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update role {RoleId}.", roleId);
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<RoleDetails>> SetRolePermissions(
            [FromQuery] int roleId,
            [FromBody] SetRolePermissionsRequest request)
        {
            try
            {
                return Ok(await _roleAdminService.SetRolePermissionsAsync(roleId, request));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set permissions for role {RoleId}.", roleId);
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult> DeactivateRole([FromQuery] int roleId)
        {
            try
            {
                var changed = await _roleAdminService.DeactivateRoleAsync(roleId);
                return changed ? NoContent() : NotFound();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deactivate role {RoleId}.", roleId);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<List<AppUserSummary>>> GetUsers()
        {
            try
            {
                return Ok(await _roleAdminService.GetUsersAsync());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to list app users.");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<AppUserSummary>> GetUser([FromQuery] int appUserId)
        {
            try
            {
                var user = await _roleAdminService.GetUserAsync(appUserId);
                return user is null ? NotFound() : Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get app user {AppUserId}.", appUserId);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<List<UserRoleDetails>>> GetUserRoles([FromQuery] int appUserId)
        {
            try
            {
                return Ok(await _roleAdminService.GetUserRolesAsync(appUserId));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get roles for app user {AppUserId}.", appUserId);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult<UserRoleDetails>> AssignRole([FromBody] AssignRoleRequest request)
        {
            try
            {
                return Ok(await _roleAdminService.AssignRoleAsync(request));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to assign role {RoleCode}.", request.RoleCode);
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult> RevokeRole([FromQuery] string serviceNumber, [FromQuery] string roleCode)
        {
            try
            {
                var removed = await _roleAdminService.RevokeRoleAsync(serviceNumber, roleCode);
                return removed ? NoContent() : NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to revoke role {RoleCode} from user {AppUserId}.", roleCode, serviceNumber);
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [AuthorizePermission(PermissionCodes.AdminRolesAssign)]
        public async Task<ActionResult> SetUserActive([FromQuery] int appUserId, [FromQuery] bool isActive)
        {
            try
            {
                await _roleAdminService.SetUserActiveAsync(appUserId, isActive);
                return NoContent();
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
                _logger.LogWarning(ex, "Failed to set active={IsActive} for user {AppUserId}.", isActive, appUserId);
                return BadRequest(ex.Message);
            }
        }
    }
}