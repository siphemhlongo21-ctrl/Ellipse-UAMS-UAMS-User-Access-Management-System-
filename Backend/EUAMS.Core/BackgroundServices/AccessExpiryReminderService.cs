using EUAMS.Core.Extensions;
using EUAMS.Core.Notifications;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EUAMS.Core.BackgroundServices
{
    /// <summary>
    /// PDF/US-026 — daily sweep that reminds requesters and Line Managers when access
    /// (temporary/contractor/acting) is nearing its EndDate. Runs every 6 hours; the
    /// "ExpiryReminder30" status-history event guards against sending more of each type.
    /// "ExpiryReminder7"
    /// "AccessExpired"
    /// </summary>
    public class AccessExpiryReminderService : BackgroundService
    {
        private static readonly TimeSpan PollInterval = TimeSpan.FromHours(6);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AccessExpiryReminderService> _logger;

        public AccessExpiryReminderService(
            IServiceScopeFactory scopeFactory,
            ILogger<AccessExpiryReminderService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunOnceAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Access expiry reminder sweep failed.");
                }

                try
                {
                    await Task.Delay(PollInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Shutdown requested during delay — loop exits on next check.
                }
            }
        }

        private async Task RunOnceAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EuamsDbContext>();
            var notifications = scope.ServiceProvider.GetRequiredService<RequestNotificationService>();

            var today = DateTime.UtcNow.Date;
            var implemented = RequestStatus.Implemented.GetDescription();

            var candidates = await db.Requests.AsNoTracking()
                .Include(o => o.Employee)
                .Include(o => o.Contractor)
                .Where(r =>
                    r.EndDate != null
                    && r.Status == implemented)
                .ToListAsync(cancellationToken);

            if (candidates.Count == 0)
            {
                return;
            }

            foreach (var request in candidates)
            {
                try
                {
                    var daysRemaining = (request.EndDate!.Value.Date - today).Days;
                    if (daysRemaining != 30 && daysRemaining != 7 && daysRemaining > 0)
                        continue;

                    var eventName = daysRemaining == 30 ? "ExpiryReminder30"
                        : daysRemaining == 7 ? "ExpiryReminder7"
                        : "AccessExpired";

                    var alreadySent = await db.RequestStatusHistories.AsNoTracking()
                        .AnyAsync(h => h.RequestId == request.Id && h.Event == eventName, cancellationToken);
                    if (alreadySent)
                        continue;

                    await notifications.NotifyExpiryRemindersAsync(request, cancellationToken);

                    db.RequestStatusHistories.Add(new RequestStatusHistory
                    {
                        RequestId = request.Id,
                        FromStatus = request.Status,
                        ToStatus = request.Status,
                        Event = eventName,
                        Reason = $"EndDate={request.EndDate:yyyy-MM-dd}; DaysRemaining={daysRemaining}",
                        ChangedByServiceNumber = null,
                        ChangedAt = DateTime.UtcNow
                    });
                    await db.SaveChangesAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Expiry reminder failed for request {RequestId} (non-blocking).", request.Id);
                }
            }
        }
    }
}
