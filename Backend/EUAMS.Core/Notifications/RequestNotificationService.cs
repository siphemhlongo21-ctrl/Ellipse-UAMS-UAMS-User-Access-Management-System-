using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Data.Entities.CesarDb;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EUAMS.Core.Notifications
{
    public class RequestNotificationService : IRequestNotificationService
    {
        private readonly EuamsDbContext _db;
        private readonly ILogger<RequestNotificationService> _logger;
        private readonly ILookupUSTEmployeeServices _lookupUSTEmployeeDetails;
        private readonly CesarDbContext _cesarDbContext;

        public RequestNotificationService(
            EuamsDbContext db,
            ILogger<RequestNotificationService> logger,
            ILookupUSTEmployeeServices lookupUSTEmployeeDetails,
            CesarDbContext cesarDbContext)
        {
            _db = db;
            _logger = logger;
            _lookupUSTEmployeeDetails = lookupUSTEmployeeDetails;
            _cesarDbContext = cesarDbContext;
        }

        public async Task NotifySubmittedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            CancellationToken cancellationToken = default)
        {
            var emailContext = await LoadContextAsync(requestId, requestNumber, requesterEmail, cancellationToken);

            var requesterSubject = $"Ellipse Access Request Submitted - {emailContext.RequestNumber}";
            var requesterBody = EmailMessageBuilder.Body(
                EmailMessageBuilder.Greeting(emailContext.RequestorName),
                "Your Ellipse Access Request has been successfully submitted and is awaiting processing.",
                EmailMessageBuilder.DetailsSection(
                    "Request Details",
                    EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                    EmailMessageBuilder.Bullet("Request Type", emailContext.RequestType),
                    EmailMessageBuilder.Bullet("Environment", emailContext.Environment),
                    EmailMessageBuilder.Bullet("Submitted By", emailContext.RequestorName),
                    EmailMessageBuilder.Bullet("Date Submitted", emailContext.SubmittedAt.ToString("yyyy-MM-dd")),
                    EmailMessageBuilder.Bullet("Time Submitted", emailContext.SubmittedAt.ToLocalTime().ToString("HH:mm"))),
                "Current Status: Awaiting Line Manager Approval",
                "You may track the progress of this request through the Ellipse User Access Management System.");

            var approverSubject = $"Ellipse Access Request Awaiting Your Approval - {emailContext.RequestNumber}";
            var approverBody = EmailMessageBuilder.Body(
                EmailMessageBuilder.Greeting(emailContext.LineManagerName),
                "An Ellipse Access Request has been assigned to you for review.",
                EmailMessageBuilder.DetailsSection(
                    "Request Details",
                    EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                    EmailMessageBuilder.Bullet("Employee/Contractor", emailContext.RequestorName),
                    EmailMessageBuilder.Bullet("Request Type", emailContext.RequestType),
                    EmailMessageBuilder.Bullet("Environment", emailContext.Environment)),
                "Please log into the Ellipse User Access Management System to review and action the request.");

            await SendToEmailsAsync(
                new[] { emailContext.RequestorEmail },
                requesterSubject, requesterBody, requestId, cancellationToken);

            if (emailContext.ShouldNotifyLineManager)
            {
                await SendToEmailsAsync(
                    new[] { emailContext.LineManagerEmail },
                    approverSubject, approverBody, requestId, cancellationToken);
            }
        }

        public async Task NotifyStepAdvancedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            string fromStatus,
            string toStatus,
            StatusHistoryEvent statusHistoryEvent,
            CancellationToken cancellationToken = default)
        {
            var emailContext = await LoadContextAsync(requestId, requestNumber, requesterEmail, cancellationToken);

            if (statusHistoryEvent == StatusHistoryEvent.LineManagerApproved)
            {
                var isProduction = string.Equals(emailContext.Environment, "Production", StringComparison.OrdinalIgnoreCase);
                var currentStatus = isProduction
                    ? "Awaiting Training Verification"
                    : "Awaiting ICT Manager Approval";

                // Template 3 - requestor
                var approveSubject = $"Ellipse Access Request Approved by Line Manager - {emailContext.RequestNumber}";
                var approvedBody = EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(emailContext.RequestorName),
                    "Your Ellipse Access Request has been approved by the Line Manager.",
                    $"Request Number: {emailContext.RequestNumber}",
                    "The request has now progressed to the next stage of the workflow.",
                    $"Current Status: {currentStatus}");

                await SendToEmailsAsync(
                    new[] { emailContext.RequestorEmail },
                    approveSubject,
                    approvedBody,
                    requestId,
                    cancellationToken);

                return;
            }

            if (statusHistoryEvent == StatusHistoryEvent.TrainingVerified)
            {
                var subject = $"Training Successfully Verified - {emailContext.RequestNumber}";
                var body = EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(emailContext.RequestorName),
                    "Training verification has been successfully completed for your Ellipse Access Request.",
                    $"Request Number: {emailContext.RequestNumber}",
                    "The request has now moved to the implementation stage.",
                    "Current Status: Awaiting HC Systems Officer Action");

                await SendToEmailsAsync(
                    new[] { emailContext.RequestorEmail },
                    subject,
                    body,
                    requestId,
                    cancellationToken);
                return;
            }

            if (statusHistoryEvent == StatusHistoryEvent.ICTManagerApproved)
            {
                var approveSubject = $"Ellipse Access Request Approved by ICT Manager - {emailContext.RequestNumber}";
                var approvedBody = EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(emailContext.RequestorName),
                    "Your Ellipse Access Request has been approved by the ICT Manager.",
                    $"Request Number: {emailContext.RequestNumber}",
                    "The request has now progressed to the next stage of the workflow.",
                    "Current Status: Awaiting HC Systems Officer Action");

                await SendToEmailsAsync(
                    new[] { emailContext.RequestorEmail },
                    approveSubject,
                    approvedBody,
                    requestId,
                    cancellationToken);

                return;
            }

            // Other events (resubmit / other) - leave generic until later stories
            var requesterSubject = $"Ellipse request {emailContext.RequestNumber} updated";
            var requesterBody = EmailMessageBuilder.Body(
                EmailMessageBuilder.Greeting(emailContext.RequestorName),
                $"Your Ellipse access request {emailContext.RequestNumber} advanced.",
                $"From: {fromStatus}",
                $"To: {toStatus}",
                $"Event: {statusHistoryEvent}");

            await SendToEmailsAsync(
                new[] { emailContext.RequestorEmail },
                requesterSubject,
                requesterBody,
                requestId,
                cancellationToken);
        }

        public async Task NotifyRejectedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            DefaultRole role,
            string? reason,
            CancellationToken cancellationToken = default)
        {
            var emailContext = await LoadContextAsync(requestId, requestNumber, requesterEmail, cancellationToken);

            if (role == DefaultRole.LineManager)
            {
                var subject = $"Ellipse Access Request Rejected - {emailContext.RequestNumber}";
                var body = EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(emailContext.RequestorName),
                    "Your Ellipse Access Request has been rejected by the Line Manager.",
                    EmailMessageBuilder.DetailsSection(
                        "Request Details",
                        EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                        EmailMessageBuilder.Bullet("Request Type", emailContext.RequestType)),
                    "Comments",
                    string.IsNullOrWhiteSpace(reason) ? "-" : reason,
                    "This request has now been closed.",
                    "If access is still required, a new request must be submitted.");

                await SendToEmailsAsync(
                    new[] { emailContext.RequestorEmail },
                    subject,
                    body,
                    requestId,
                    cancellationToken);
                return;
            }

            if (role == DefaultRole.TrainingCentre)
            {
                var subject = "Ellipse Access Request Rejected - Training Not Verified";
                var comments = string.IsNullOrWhiteSpace(reason) ? "-" : reason;

                var requestorBody = EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(emailContext.RequestorName),
                    "The following access request could not proceed because training requirements have not been verified.",
                    $"Request Number: {emailContext.RequestNumber}",
                    "Comments",
                    comments,
                    "This request has been closed.");

                await SendToEmailsAsync(
                    new[] { emailContext.RequestorEmail },
                    subject,
                    requestorBody,
                    requestId,
                    cancellationToken);

                if (emailContext.ShouldNotifyLineManager)
                {
                    var managerBody = EmailMessageBuilder.Body(
                        EmailMessageBuilder.Greeting(emailContext.LineManagerName),
                        "The following access request could not proceed because training requirements have not been verified.",
                        $"Request Number: {emailContext.RequestNumber}",
                        "Comments",
                        comments,
                        "This request has been closed.");

                    await SendToEmailsAsync(
                        new[] { emailContext.LineManagerEmail },
                        subject,
                        managerBody,
                        requestId,
                        cancellationToken);
                }

                return;
            }

            if (role == DefaultRole.IctManager)
            {
                var subject = $"Test/Development Access Request Rejected - {emailContext.RequestNumber}";
                var comments = string.IsNullOrWhiteSpace(reason) ? "-" : reason;

                var requestorBody = EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(emailContext.RequestorName),
                    "The ICT Manager has rejected the following request:",
                    $"Request Number: {emailContext.RequestNumber}",
                    "Comments",
                    comments,
                    "This request has been closed.");

                await SendToEmailsAsync(
                    new[] { emailContext.RequestorEmail },
                    subject,
                    requestorBody,
                    requestId,
                    cancellationToken);

                if (emailContext.ShouldNotifyLineManager)
                {
                    var managerBody = EmailMessageBuilder.Body(
                        EmailMessageBuilder.Greeting(emailContext.LineManagerName),
                        "The ICT Manager has rejected the following request:",
                        $"Request Number: {emailContext.RequestNumber}",
                        "Comments",
                        comments,
                        "This request has been closed.");

                    await SendToEmailsAsync(
                        new[] { emailContext.LineManagerEmail },
                        subject,
                        managerBody,
                        requestId,
                        cancellationToken);
                }
                return;
            }

            if (role == DefaultRole.HcSystemsOfficer)
            {
                var subject = $"Ellipse Access Request Rejected - {emailContext.RequestNumber}";
                var comments = string.IsNullOrWhiteSpace(reason) ? "-" : reason;

                async Task SendAsync(string? email, string name)
                {
                    var body = EmailMessageBuilder.Body(
                        EmailMessageBuilder.Greeting(name),
                        "The HC Systems Officer has rejected the request.",
                        $"Request Number: {emailContext.RequestNumber}",
                        "Comments",
                        comments,
                        "This request has been closed.",
                        "If access is still required, a new request must be submitted.");

                    await SendToEmailsAsync(
                        new[] { email },
                        subject,
                        body,
                        requestId,
                        cancellationToken);
                }

                await SendAsync(emailContext.RequestorEmail, emailContext.RequestorName);
                if (emailContext.ShouldNotifyLineManager)
                    await SendAsync(emailContext.LineManagerEmail, emailContext.LineManagerName);
                return;
            }
        }

        public async Task NotifyImplementedAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            CancellationToken cancellationToken = default)
        {
            var emailContext = await LoadContextAsync(requestId, requestNumber, requesterEmail, cancellationToken);
            var subject = $"Ellipse Access Successfully Implemented - {emailContext.RequestNumber}";
            var implemented = emailContext.DateImplemented?.ToString("yyyy-MM-dd") ?? "-";

            string BuildBody(string greetingName) => EmailMessageBuilder.Body(
                EmailMessageBuilder.Greeting(greetingName),
                "Your Ellipse Access Request has been successfully implemented.",
                EmailMessageBuilder.DetailsSection(
                    "Request Details",
                    EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                    EmailMessageBuilder.Bullet("Request Type", emailContext.RequestType),
                    EmailMessageBuilder.Bullet("Environment", emailContext.Environment),
                    EmailMessageBuilder.Bullet("Ellipse User ID", emailContext.EllipseUserId),
                    EmailMessageBuilder.Bullet("Date Implemented", implemented)),
                "The request has been completed and closed.");

            await SendToEmailsAsync(
                new[] { emailContext.RequestorEmail },
                subject,
                BuildBody(emailContext.RequestorName),
                requestId,
                cancellationToken);

            if (emailContext.ShouldNotifyLineManager)
            {
                await SendToEmailsAsync(
                new[] { emailContext.LineManagerEmail },
                subject,
                BuildBody(emailContext.LineManagerName),
                requestId,
                cancellationToken);
            }
        }

        public async Task NotifyReturnForAmendmentAsync(
            int requestId,
            string? requestNumber,
            string employeeEmail,
            string reason,
            CancellationToken cancellationToken = default)
        {

            var emailContext = await LoadContextAsync(requestId, requestNumber, employeeEmail, cancellationToken);
            var subject = $"Additional Information Required - {emailContext.RequestNumber}";
            var comments = string.IsNullOrWhiteSpace(reason) ? "-" : reason;

            var documentsRequested = await _db.DocumentResubmissionRequests.AsNoTracking()
                .Where(d => d.RequestId == requestId)
                .OrderByDescending(d => d.RequestedAt)
                .Select(d => d.DocumentsRequested)
                .FirstOrDefaultAsync(cancellationToken);

            var documentLines = (documentsRequested ?? "")
            .Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => "\u2022 " + item)
            .DefaultIfEmpty("\u2022 " + comments)
            .ToArray();

            string BuildBody(string greetingName) => EmailMessageBuilder.Body(
                EmailMessageBuilder.Greeting(greetingName),
                "The HC Systems Officer has reviewed the request and requires additional information and/or supporting documentation before processing can continue.",
                EmailMessageBuilder.DetailsSection(
                    "Request Details",
                    EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                    EmailMessageBuilder.Bullet("Current Status", "Awaiting Re-submission")),
                    "Reason",
                    comments,
                    "Documents/Information Required.",
                    string.Join("\r\n", documentLines),
                    "Please log into the system and resubmit the required information.");

            await SendToEmailsAsync(
                new[] { emailContext.RequestorEmail },
                subject,
                BuildBody(emailContext.RequestorName),
                requestId,
                cancellationToken);

            if (emailContext.ShouldNotifyLineManager)
                await SendToEmailsAsync(
                    new[] { emailContext.LineManagerEmail },
                    subject,
                    BuildBody(emailContext.LineManagerName),
                    requestId,
                    cancellationToken);

        }

        public async Task NotifyCancelledAsync(
            int requestId,
            string? requestNumber,
            string? requesterEmail,
            CancellationToken cancellationToken = default)
        {
            var emailContext = await LoadContextAsync(requestId, requestNumber, requesterEmail, cancellationToken);
            var recipients = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { emailContext.RequestorEmail };
            if (emailContext.ShouldNotifyLineManager)
                recipients.Add(emailContext.LineManagerEmail!);

            var subject = $"Ellipse request {emailContext.RequestNumber} cancelled";
            var body = EmailMessageBuilder.Body(
                $"Ellipse access request {emailContext.RequestNumber} has been cancelled." +
                "No further workflow action is required.");

            await SendToEmailsAsync(recipients, subject, body, requestId, cancellationToken);

        }

        public async Task NotifyExpiryRemindersAsync(
            int requestId,
            string? requestNumber,
            string? employeeEmail,
            DateTime endDate,
            int daysRemaining,
            CancellationToken cancellationToken = default)
        {

            var emailContext = await LoadContextAsync(requestId, requestNumber, employeeEmail, cancellationToken);
            var expiry = endDate.ToString("yyyy-MM-dd");

            Func<string, string> BuildBody;
            string subject;

            if (daysRemaining == 30)
            {
                subject = $"Access Expiry Notification - {emailContext.RequestNumber}";
                BuildBody = name => EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(name),
                    "This is to advise that the following Ellipse access is due to expire.",
                    EmailMessageBuilder.DetailsSection(
                        "Details",
                        EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                        EmailMessageBuilder.Bullet("Environment", emailContext.Environment),
                        EmailMessageBuilder.Bullet("Access End Date", expiry)),
                    "Please take the necessary action if continued access is required.");

            }
            else if (daysRemaining == 7)
            {
                subject = $"Urgent: Access Expiry in 7 Days - {emailContext.RequestNumber}";
                BuildBody = name => EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(name),
                    "The following Ellipse access will expire within the next 7 days.",
                    EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                    EmailMessageBuilder.Bullet("Access Expiry Date", expiry),
                    "If continued access is required, please submit a new request before the expiry date.");
            }
            else if (daysRemaining <= 0)
            {
                subject = $"Ellipse Access Expired - {emailContext.RequestNumber}";
                BuildBody = name => EmailMessageBuilder.Body(
                    EmailMessageBuilder.Greeting(name),
                    "The following Ellipse access has now expired:",
                    EmailMessageBuilder.Bullet("Request Number", emailContext.RequestNumber),
                    EmailMessageBuilder.Bullet("Expiry Date", expiry),
                    "Access has been removed or is scheduled for removal in accordance with the approved access period.");
            }
            else
            {
                return; // job should not call for other day counts
            }
            await SendToEmailsAsync(
                new[] { emailContext.RequestorEmail },
                subject,
                BuildBody(emailContext.RequestorName),
                requestId,
                cancellationToken);
            if (emailContext.ShouldNotifyLineManager)
                await SendToEmailsAsync(
                    new[] { emailContext.LineManagerEmail },
                    subject,
                    BuildBody(emailContext.LineManagerName),
                    requestId,
                    cancellationToken);
        }

        private static (string? roleCode, string? label) MapNextApprover(string toStatus)
        {
            return toStatus switch
            {
                "PendingApproval" => (RoleCodes.LineManager, "Line Manager"),
                "TrainingVerificationPending" => (RoleCodes.TrainingCentre, "Training Centre"),
                "ICTManagerApprovalPending" => (RoleCodes.IctManager, "ICT Manager"),
                "HcActionPending" => (RoleCodes.HcSystemsOfficer, "HC Systems Officer"),
                _ => (null, null)
            };
        }

        private async Task<Request?> LoadRequestAsync(int requestId, CancellationToken cancellationToken)
        {
            return await _db.Requests.AsNoTracking()
            .Include(r => r.Employee)
            .Include(r => r.Contractor)
            .FirstOrDefaultAsync(r => r.Id == requestId, cancellationToken);
        }

        private async Task<RequestEmailContext> LoadContextAsync(
            int requestId,
            string? requestNumber,
            string? fallbackEmail,
            CancellationToken cancellationToken)
        {
            var request = await LoadRequestAsync(requestId, cancellationToken);
            var isEmployee = string.Equals(request?.UserType, UserType.Employee.GetDescription(), StringComparison.OrdinalIgnoreCase);

            var requestorEmail = new[]
            {
                request?.EmployeeEmail,
                request?.Employee?.EmailAddress,
                request?.Contractor?.EmailAddress,
                fallbackEmail

            }.FirstOrDefault(e => !string.IsNullOrWhiteSpace(e))?.Trim();

            var requestorName = isEmployee
                ? EmailMessageBuilder.PersonName(request?.Employee?.FirstName, request?.Employee?.Surname)
                : EmailMessageBuilder.PersonName(request?.Contractor?.FirstName, request?.Contractor?.Surname);

            USTEmployeeDetails? lineManager = null;
            if (isEmployee && !string.IsNullOrWhiteSpace(requestorEmail))
                lineManager = await TryGetLineManagerAsync(requestorEmail, requestId);

            return new RequestEmailContext
            {
                RequestId = requestId,
                RequestNumber = requestNumber ?? $"#{requestId}",
                RequestorName = requestorName,
                RequestorEmail = requestorEmail,
                RequestType = EmailMessageBuilder.Value(request?.RequestType),
                Environment = EmailMessageBuilder.Value(request?.Environment),
                SubmittedAt = request?.RequestedDate ?? DateTime.UtcNow,
                IsEmployeeRequest = isEmployee,
                LineManager = lineManager,
                EllipseUserId = request?.EllipseUserId,
                DateImplemented = request?.DateAccessGranted
            };
        }

        private async Task<USTEmployeeDetails?> TryGetLineManagerAsync(string employeeEmail, int requestId)
        {
            try
            {
                var manager = await _lookupUSTEmployeeDetails
                    .GetEmployeeManagerDetailsByEmployeeEmail(employeeEmail);
                return string.IsNullOrWhiteSpace(manager.Email) ? null : manager;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not resolve Line Manager for request {RequestId}.", requestId);
                return null;
            }
        }

        private async Task SendToEmailsAsync(
            IEnumerable<string?> recipients,
            string subject,
            string body,
            int requestId,
            CancellationToken cancellationToken,
            string? requestRef = null)
        {
            var list = recipients
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (list.Count == 0)
            {
                _logger.LogWarning(
                    "Notification for request {RequestId} ({Subject}) had no resolvable recipients.",
                    requestId,
                    subject);
                return;
            }

            foreach (var to in list)
            {
                try
                {
                    var email = new EmailQueueItem
                    {
                        QueueDateTime = DateTime.Now,
                        ApplicationId = 7,//Hard coded => eservices App id
                        EmailAccountId = 5,//Hard coded => noreply
                        ToList = to,
                        CcList = null,
                        BccList = null,
                        Subject = subject,
                        Body = body,
                        IsHtml = false,
                        FailureCount = 0,
                        ReferenceId = requestRef ?? requestId.ToString(),
                        HasAttachments = false
                    };

                    await _cesarDbContext.EmailQueue.AddAsync(email, cancellationToken);
                    await _cesarDbContext.SaveChangesAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to send notification to {To} for request {RequestId}",
                        to,
                        requestId);
                }
            }
        }

        private sealed class RequestEmailContext
        {
            public required int RequestId { get; init; }
            public required string RequestNumber { get; init; }
            public required string RequestorName { get; init; }
            public string? RequestorEmail { get; init; }
            public required string RequestType { get; init; }
            public required string Environment { get; init; }
            public required DateTime SubmittedAt { get; init; }
            public string? EllipseUserId { get; init; }
            public DateTime? DateImplemented { get; init; }
            public required bool IsEmployeeRequest { get; init; }
            public USTEmployeeDetails? LineManager { get; init; }

            public string LineManagerName =>
                EmailMessageBuilder.PersonName(
                    LineManager?.PrefName ?? LineManager?.FirstName,
                    LineManager?.Surname);

            public string? LineManagerEmail =>
                string.IsNullOrWhiteSpace(LineManager?.Email) ? null : LineManager.Email.Trim();

            public bool LineManagerIsRequestee =>
                IsEmployeeRequest
                && !string.IsNullOrWhiteSpace(RequestorEmail)
                && !string.IsNullOrWhiteSpace(LineManagerEmail)
                && string.Equals(RequestorEmail, LineManagerEmail, StringComparison.OrdinalIgnoreCase);

            public bool ShouldNotifyLineManager =>
                IsEmployeeRequest && !string.IsNullOrWhiteSpace(LineManagerEmail);
        }
    }
}
