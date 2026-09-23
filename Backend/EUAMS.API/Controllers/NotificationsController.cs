using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Notifications;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly IAppNotificationService _notifications;

        public NotificationsController(IAppNotificationService notifications)
        {
            _notifications = notifications;
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked,
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestCreateSelf,
            PermissionCodes.RequestCreateManaged)]
        public async Task<ActionResult<NotificationSummary>> Mine(
            [FromQuery] int take = 50,
            CancellationToken cancellationToken = default)
        {
            return Ok(await _notifications.GetMineAsync(take, cancellationToken));
        }

        [HttpGet]
        [AuthorizePermission(
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked,
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestCreateSelf,
            PermissionCodes.RequestCreateManaged)]
        public async Task<ActionResult<int>> UnreadCount(CancellationToken cancellationToken = default)
        {
            return Ok(await _notifications.GetUnreadCountAsync(cancellationToken));
        }

        [HttpPost]
        [AuthorizePermission(
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked,
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestCreateSelf,
            PermissionCodes.RequestCreateManaged)]
        public async Task<ActionResult> MarkRead(long id, CancellationToken cancellationToken = default)
        {
            await _notifications.MarkReadAsync(id, cancellationToken);
            return Ok();
        }

        [HttpPost]
        [AuthorizePermission(
            PermissionCodes.RequestViewOwn,
            PermissionCodes.RequestViewTeam,
            PermissionCodes.RequestViewLinked,
            PermissionCodes.RequestSearchAll,
            PermissionCodes.RequestCreateSelf,
            PermissionCodes.RequestCreateManaged)]
        public async Task<ActionResult> MarkAllRead(CancellationToken cancellationToken = default)
        {
            await _notifications.MarkAllReadAsync(cancellationToken);
            return Ok();
        }
    }
}
