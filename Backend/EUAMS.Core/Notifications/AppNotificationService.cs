using EUAMS.Data;
using EUAMS.Shared.DTOs.Notifications;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Notifications
{
    public class AppNotificationService : IAppNotificationService
    {
        private readonly EuamsDbContext _db;
        private readonly ICurrentUserService _currentUser;

        public AppNotificationService(EuamsDbContext db, ICurrentUserService currentUser)
        {
            _db = db;
            _currentUser = currentUser;
        }

        public async Task<NotificationSummary> GetMineAsync(int take = 50, CancellationToken cancellationToken = default)
        {
            await _currentUser.EnsureLoadedAsync(cancellationToken);
            if (_currentUser.ServiceNumber is not string serviceNumber)
            {
                return new NotificationSummary();
            }

            take = Math.Clamp(take, 1, 200);
            var items = await _db.AppNotifications.AsNoTracking()
                .Where(n => n.ServiceNumber == serviceNumber)
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .Select(n => new AppNotificationDetails
                {
                    Id = n.Id,
                    RequestId = n.RequestId,
                    RequestNumber = n.Request != null ? n.Request.RequestNumber : null,
                    Category = n.Category,
                    Title = n.Title,
                    Body = n.Body,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync(cancellationToken);

            var unread = await _db.AppNotifications.AsNoTracking()
                .CountAsync(n => n.ServiceNumber == serviceNumber && !n.IsRead, cancellationToken);

            return new NotificationSummary
            {
                UnreadCount = unread,
                Items = items
            };
        }

        public async Task<int> GetUnreadCountAsync(CancellationToken cancellationToken = default)
        {
            await _currentUser.EnsureLoadedAsync(cancellationToken);
            if (_currentUser.ServiceNumber is not string serviceNumber)
            {
                return 0;
            }

            return await _db.AppNotifications.AsNoTracking()
                .CountAsync(n => n.ServiceNumber == serviceNumber && !n.IsRead, cancellationToken);
        }

        public async Task MarkReadAsync(long notificationId, CancellationToken cancellationToken = default)
        {
            await _currentUser.EnsureLoadedAsync(cancellationToken);
            if (_currentUser.ServiceNumber is not string serviceNumber)
            {
                return;
            }

            var row = await _db.AppNotifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.ServiceNumber == serviceNumber, cancellationToken);
            if (row is null || row.IsRead)
            {
                return;
            }

            row.IsRead = true;
            row.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task MarkAllReadAsync(CancellationToken cancellationToken = default)
        {
            await _currentUser.EnsureLoadedAsync(cancellationToken);
            if (_currentUser.ServiceNumber is not string serviceNumber)
            {
                return;
            }

            var rows = await _db.AppNotifications
                .Where(n => n.ServiceNumber == serviceNumber && !n.IsRead)
                .ToListAsync(cancellationToken);
            if (rows.Count == 0)
            {
                return;
            }

            var now = DateTime.UtcNow;
            foreach (var row in rows)
            {
                row.IsRead = true;
                row.ReadAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
