namespace EUAMS.Core.Notifications
{
    public class EmailOptions
    {
        public const string SectionName = "Email";

        public bool Enabled { get; set; }

        public string Host { get; set; } = "localhost";

        public int Port { get; set; } = 25;

        public bool EnableSsl { get; set; }

        public string? Username { get; set; }

        public string? Password { get; set; }

        /// <summary>Legacy nested credentials block (Email:Credentials:EmailAddress/Password).</summary>
        public EmailCredentialOptions? Credentials { get; set; }

        public string FromAddress { get; set; } = "ellipse-noreply@localhost";

        public string FromDisplayName { get; set; } = "Ellipse Access Management";

        /// <summary>Optional distribution lists for role queues (used in addition to user emails).</summary>
        public string? LineManagerInbox { get; set; }

        public string? TrainingCentreInbox { get; set; }

        public string? IctManagerInbox { get; set; } 

        public string? HcSystemsOfficerInbox { get; set; }

        /// <summary>How many days ahead of EndDate to start sending expiry reminders.</summary>
        public int ExpiryReminderDaysAhead { get; set; } = 30;

        public string? ResolvedUsername =>
            !string.IsNullOrWhiteSpace(Username) ? Username : Credentials?.EmailAddress;

        public string? ResolvedPassword =>
            !string.IsNullOrWhiteSpace(Password) ? Password : Credentials?.Password;
    }

    public class EmailCredentialOptions
    {
        public string? EmailAddress { get; set; }

        public string? Password { get; set; }
    }
}
