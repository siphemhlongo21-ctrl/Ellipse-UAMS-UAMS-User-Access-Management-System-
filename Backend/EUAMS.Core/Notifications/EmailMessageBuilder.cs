namespace EUAMS.Core.Notifications
{
    internal static class EmailMessageBuilder
    {
        public const string SignOff = "\r\n\r\nKind regards,\r\nEllipse User Access Management System";

        public static string Greeting(string? name) =>
            $"Dear {(string.IsNullOrWhiteSpace(name) ? "Colleague" : name.Trim())},";

        public static string PersonName(string? firstName, string? surname)
        {
            var name = $"{firstName} {surname}".Trim();
            return string.IsNullOrWhiteSpace(name) ? "Colleague" : name;
        }

        public static string Value(string? value) =>
            string.IsNullOrWhiteSpace(value) ? "-" : value.Trim();

        public static string Bullet(string label, string? value) =>
            $"\u2022 {label}: {Value(value)}";

        public static string DetailsSection(string heading, params string[] bullets) =>
            heading + "\r\n" + string.Join("\r\n", bullets);

        public static string Body(params string[] blocks)
        {
            var parts = blocks.Where(static b => !string.IsNullOrWhiteSpace(b));
            return string.Join("\r\n\r\n", parts) + SignOff;
        }
    }
}