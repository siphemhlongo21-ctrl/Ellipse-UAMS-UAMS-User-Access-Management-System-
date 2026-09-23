using EUAMS.Shared.DTOs.Notifications;

namespace EUAMS.Shared.Interfaces
{
    public interface IAppNotificationService
    {
        Task<NotificationSummary> GetMineAsync(int take = 50, CancellationToken cancellationToken = default);

        Task<int> GetUnreadCountAsync(CancellationToken cancellationToken = default);

        Task MarkReadAsync(long notificationId, CancellationToken cancellationToken = default);

        Task MarkAllReadAsync(CancellationToken cancellationToken = default);
    }
}
