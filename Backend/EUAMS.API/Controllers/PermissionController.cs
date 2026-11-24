using EUAMS.Shared.DTOs.Permission;
using EUAMS.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    [Authorize]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly ILogger<PermissionController> _logger;
        public PermissionController(IPermissionService permissionService, ILogger<PermissionController> logger)
        {
            _permissionService = permissionService;
            _logger = logger;

        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyCollection<PermissionDetails>>> GetPermissions(
            [FromQuery] string? permissionName = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var permissions = await _permissionService.GetPermissionsAsync(
                    permissionName,
                    cancellationToken);

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("{permissionId:int}")]
        public async Task<ActionResult<PermissionDetails>> GetPermission(
            int permissionId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var permission = await _permissionService.GetPermissionAsync(
                    permissionId,
                    cancellationToken);

                if (permission == null)
                {
                    return NotFound();
                }

                return Ok(permission);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<PermissionDetails>> CreatePermission(
          [FromBody] PermissionDetails permission,
          CancellationToken cancellationToken = default)
        {
            try
            {
                var createdPermission = await _permissionService.CreatePermissionAsync(
                    permission,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetPermission),
                    new { permissionId = createdPermission.Id },
                    createdPermission);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex, "Error creating permission with code {PermissionCode}", permission.Code);

                return StatusCode(500, new
                {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        [HttpPut("{permissionId:int}")]
        public async Task<ActionResult<PermissionDetails>> UpdatePermission(
           int permissionId,
           [FromBody] PermissionDetails permission,
            CancellationToken cancellationToken = default)
        {
            try
            {
                permission.Id = permissionId;

                var updatedPermission = await _permissionService.UpdatePermissionAsync(
                    permission,
                    cancellationToken);

                if (updatedPermission == null)
                {
                    return NotFound();
                }

                return Ok(updatedPermission);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error updating permission with ID {PermissionId}",
                    permissionId);
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete("{permissionId:int}")]
        public async Task<IActionResult> DeletePermission(
            int permissionId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var deleted = await _permissionService.DeletePermissionAsync(
                    permissionId,
                    cancellationToken);

                if (!deleted)
                {
                    return NotFound("Cannot delete a permission that is currently assigned to roles.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error deleting permission with ID {PermissionId}",
                    permissionId);

                return StatusCode(500, ex.Message);
            }
        }
    }
}