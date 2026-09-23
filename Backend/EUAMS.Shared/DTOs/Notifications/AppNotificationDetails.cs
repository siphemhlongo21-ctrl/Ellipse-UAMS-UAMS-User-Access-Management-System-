namespace EUAMS.Shared.DTOs.Notifications
{
    public class AppNotificationDetails
    {
        public long Id { get; set; }

        public int? RequestId { get; set; }

        public string? RequestNumber { get; set; }

        public string Category { get; set; } = "Request";

        public string Title { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class NotificationSummary
    {
        public int UnreadCount { get; set; }

        public List<AppNotificationDetails> Items { get; set; } = [];
    }
}
