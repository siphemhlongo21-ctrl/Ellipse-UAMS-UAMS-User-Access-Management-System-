using EUAMS.Shared.Enums;

namespace EUAMS.Shared.Interfaces
{
    public interface IRequestNotificationService
    {
        /// <summary>Request submitted — notify requester and next approver (Line Manager).</summary>
        Task NotifySubmittedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            CancellationToken cancellationToken = default);

        /// <summary>Step advanced — notify requester and the next role queue.</summary>
        Task NotifyStepAdvancedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            string fromStatus,
            string toStatus,
            StatusHistoryEvent statusHistoryEvent,
            CancellationToken cancellationToken = default);

        /// <summary>Request rejected — notify requester.</summary>
        Task NotifyRejectedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            DefaultRole role,
            string? reason,
            CancellationToken cancellationToken = default);

        /// <summary>Request implemented/closed — notify requester.</summary>
        Task NotifyImplementedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            CancellationToken cancellationToken = default);

        /// <summary>Returned for amendment — notify requester and Line Manager.</summary>
        Task NotifyReturnForAmendmentAsync(
            int requestId,
            string? requestNumber,
            string? employeeEmail,
            string reason,
            CancellationToken cancellationToken = default);

        /// <summary>Request cancelled — notify requester (and Line Manager when known).</summary>
        Task NotifyCancelledAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            CancellationToken cancellationToken = default);

        /// <summary>Access nearing its EndDate — notify requester/subject and their Line Manager.</summary>
        Task NotifyExpiryRemindersAsync(
            int requestId,
            string? requestNumber,
            string? employeeEmail,
            DateTime endDate,
            int daysRemaining,
            CancellationToken cancellationToken = default);
    }
}
