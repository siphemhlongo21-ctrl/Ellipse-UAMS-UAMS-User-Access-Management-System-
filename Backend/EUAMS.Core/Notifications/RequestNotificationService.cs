using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Data.Entities.Base;
using EUAMS.Data.Entities.CesarDb;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;

namespace EUAMS.Core.Notifications
{
    public class RequestNotificationService
    {
        private readonly EuamsDbContext _db;
        private readonly ILogger<RequestNotificationService> _logger;
        private readonly ILookupUSTEmployeeServices _lookupUSTEmployeeDetails;
        private readonly CesarDbContext _cesarDbContext;
        private readonly ICurrentUserService _currentUser;

        public RequestNotificationService(
            EuamsDbContext db,
            ILogger<RequestNotificationService> logger,
            ILookupUSTEmployeeServices lookupUSTEmployeeDetails,
            CesarDbContext cesarDbContext,
            ICurrentUserService currentUser)
        {
            _db = db;
            _logger = logger;
            _lookupUSTEmployeeDetails = lookupUSTEmployeeDetails;
            _cesarDbContext = cesarDbContext;
            _currentUser = currentUser;
        }

        public async Task NotifySubmittedAsync(Request request, bool notifyLineManager = false, CancellationToken cancellationToken = default)
        {
            var requestSubmitter = await GetRequestSubmitter(request);
            var requestor = GetRequestRequestor(request);
            var lineManager = await GetRequestLineManager(request);

            var isTermination = (request.RequestType ?? string.Empty).Contains("terminate", StringComparison.OrdinalIgnoreCase);
            string currentStatus;

            if (isTermination)
            {
                var hcOfficers = await _lookupUSTEmployeeDetails.GetHcSystemOfficer();
                var hcOfficerName = hcOfficers.FirstOrDefault()?.ToString() ?? "HC Systems Officer";
                currentStatus = $"Current Status: Awaiting HC Systems Officer Termination by {hcOfficerName}";
            }
            else
            {
                if (request.Contractor != null && request.Environment == Environments.Production.GetDescription())
                {
                    currentStatus = "Current Status: Awaiting Training Verification";
                }
                else if(request.Contractor != null)
                {
					currentStatus = "Current Status: Awaiting ICT Manager Approval";
				}
				else
					currentStatus = $"Current Status: Awaiting Line Manager Approval by {lineManager}";
			}

            await SendEmployeeEmail(requestor, request, requestSubmitter, cancellationToken, lineManager.ToString(), currentStatus);
            if (notifyLineManager)
                await SendLineManagerReviewEmail(requestor, request, requestSubmitter, cancellationToken, lineManager);
        }

        private Requestor GetRequestRequestor(Request request)
        {
            var requestor = request.Employee ?? request.Contractor as Requestor;

            if (requestor == null) throw new KeyNotFoundException("Invalid requestor details");

            return requestor;
        }

        private async Task<USTEmployeeDetails> GetRequestSubmitter(Request request)
        {
            var requestSubmitter = await _lookupUSTEmployeeDetails.GetEmployeeDetailsByServiceNumber(request.SubmittedByServiceNumber);

            if (requestSubmitter == null) throw new KeyNotFoundException($"Invalid request submitter service number {request.SubmittedByServiceNumber}");

            return requestSubmitter;
        }

        private async Task<USTEmployeeDetails> GetRequestLineManager(Request request)
        {
            USTEmployeeDetails? lineManager = null;

            if (request.Employee != null)
                lineManager = await _lookupUSTEmployeeDetails.GetEmployeeManagerDetailsByEmployeeEmail(request.Employee.EmailAddress);

            if (request.Contractor != null)
                lineManager = await _lookupUSTEmployeeDetails.GetEmployeeDetailsByServiceNumber(request.Contractor.ResponsibleManager);

            if (lineManager == null) throw new KeyNotFoundException("Invalid request line manager details");

            return lineManager;
        }

        private async Task SendEmployeeEmail(Requestor requestor, Request request, USTEmployeeDetails requestSubmitter, CancellationToken cancellationToken, string lineManager, string currentStatus)
        {
            var requesterSubject = $"Ellipse Access Request Submitted - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/EmployeeNewRequest.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", requestor.ToString())
                .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                .Replace("{{req_type}}", request.RequestType)
                .Replace("{{environment}}", request.Environment)
                .Replace("{{submitted_by}}", $"{requestSubmitter.FirstName} {requestSubmitter.Surname}")
                .Replace("{{submitted_date}}", request.RequestedDate.ToString("yyyy-MM-dd"))
                .Replace("{{submitted_time}}", request.RequestedDate.ToLocalTime().ToString("HH:mm"))
                .Replace("{{line_manager}}", lineManager)
                .Replace("{{current_status}}", currentStatus);

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, requesterSubject, emailBody, request.Id, cancellationToken, request.RequestNumber);
        }

        private async Task SendLineManagerReviewEmail(Requestor requestor, Request request, USTEmployeeDetails requestSubmitter, CancellationToken cancellationToken, USTEmployeeDetails? lineManager)
        {
            var subject = $"Ellipse Access Request Awaiting Your Approval - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/LineManagerPending.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", lineManager != null ? lineManager.ToString() : _currentUser.DisplayName)
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{req_type}}", request.RequestType)
               .Replace("{{environment}}", request.Environment)
               .Replace("{{employee_name}}", requestor.ToString());

            await SendToEmailsAsync(new[] { lineManager != null ? lineManager.Email : _currentUser.Email }, subject, emailBody, request.Id, cancellationToken, request.RequestNumber);
        }

        private async Task SendAwaitingLineMangagerApprovalEmail(Request request, bool isProduction, CancellationToken cancellationToken)
        {
            var requestor = GetRequestRequestor(request);

            var currentStatus = isProduction
                ? RequestStatus.TrainingVerificationPending.GetDescription()
                : RequestStatus.ICTManagerApprovalPending.GetDescription();

            var subject = $"Ellipse Access Request Approved by Line Manager - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/ApprovedRequest.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{approver}}", _currentUser.DisplayName)
               .Replace("{{current_req_status}}", currentStatus);

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);
        }

        private async Task SendAwaitingIctManagerApprovalEmail(Request request, CancellationToken cancellationToken)
        {
            var ictManagers = await _lookupUSTEmployeeDetails.GetIctManagers();
            var subject = $"Test/Development Access Request Awaiting Approval - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/IctManagerPending.html");

            foreach (var ictManager in ictManagers)
            {
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", ictManager.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString());

                await SendToEmailsAsync(new[] { ictManager.Email }, subject, emailBody, request.Id, cancellationToken);
            }
        }

        private async Task SendAwaitingTrainingVerificationEmail(Request request, CancellationToken cancellationToken)
        {
            var requestor = GetRequestRequestor(request);
            var trainingRepresentatives = await _lookupUSTEmployeeDetails.GetTrainingCenterRepresentatives();
            var subject = $"Ellipse Access Request Awaiting Training Verification - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/TrainingVerificationPending.html");

            foreach (var trainingRepresentstive in trainingRepresentatives)
            {
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", trainingRepresentstive.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                   .Replace("{{req_type}}", request.RequestType)
                   .Replace("{{employee_name}}", requestor.ToString());

                await SendToEmailsAsync(new[] { trainingRepresentstive.Email }, subject, emailBody, request.Id, cancellationToken);
            }
        }

        private async Task SendTrainingVerifiedEmail(Request request, CancellationToken cancellationToken)
        {
            var requestor = GetRequestRequestor(request);
            var subject = $"Training Successfully Verified - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/TrainingVerified.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{approver}}", _currentUser.DisplayName);

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);
        }

        private async Task SendIctManagerApprovedEmail(Request request, CancellationToken cancellationToken)
        {
            var requestor = GetRequestRequestor(request);
            var subject = $"Ellipse Access Request Approved by ICT Manager  - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/IctManagerApproved.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{approver}}", _currentUser.DisplayName);

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);
        }

        public async Task NotifyStepAdvancedAsync(Request request, StatusHistoryEvent statusHistoryEvent, CancellationToken cancellationToken = default)
        {
            if (request == null) throw new KeyNotFoundException($"Invalid request  number {request.RequestNumber ?? request.Id.ToString()}");

            var isProductionRequest = string.Equals(request.Environment, "Production", StringComparison.OrdinalIgnoreCase);
            var isTerminateRequest = request.RequestType.ToLower().Contains("terminate");

            if (statusHistoryEvent == StatusHistoryEvent.LineManagerCreatedRequest)
            {
                if(isTerminateRequest)
                {
                    await SendHcOfficerAwaitingImplementation(request, cancellationToken);

                    return;
                }

                if (!isProductionRequest)
                    await SendAwaitingIctManagerApprovalEmail(request, cancellationToken);
                else
                    await SendAwaitingTrainingVerificationEmail(request, cancellationToken);

                return;
            }

            if (statusHistoryEvent == StatusHistoryEvent.LineManagerApproved)
            {
                await SendAwaitingLineMangagerApprovalEmail(request, isProductionRequest, cancellationToken);

                if (!isProductionRequest)
                    await SendAwaitingIctManagerApprovalEmail(request, cancellationToken);
                else
                    await SendAwaitingTrainingVerificationEmail(request, cancellationToken);

                return;
            }

            if (statusHistoryEvent == StatusHistoryEvent.TrainingVerified)
            {
                await SendTrainingVerifiedEmail(request, cancellationToken);
                await SendHcOfficerAwaitingImplementation(request, cancellationToken);

                return;
            }

            if (statusHistoryEvent == StatusHistoryEvent.ICTManagerApproved)
            {
                await SendIctManagerApprovedEmail(request, cancellationToken);
                await SendHcOfficerAwaitingImplementation(request, cancellationToken);

                return;
            }
        }

        private async Task SendHcOfficerAwaitingImplementation(Request request, CancellationToken cancellationToken)
        {
            var requestor = GetRequestRequestor(request);
            var hcSystemOfficer = await _lookupUSTEmployeeDetails.GetHcSystemOfficer();
            var subject = $"Ellipse Access Request Awaiting Your Approval  - {request.RequestNumber ?? request.Id.ToString()}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/HcOfficerPendingRequest.html");

            foreach (var officer in hcSystemOfficer)
            {
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", officer.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                   .Replace("{{req_type}}", request.RequestType)
                   .Replace("{{environment}}", request.Environment)
                   .Replace("{{employee_name}}", requestor.ToString());

                await SendToEmailsAsync(new[] { officer.Email }, subject, emailBody, request.Id, cancellationToken);
            }
        }

        public async Task NotifyRejectedAsync(DefaultRole role, Request request, CancellationToken cancellationToken = default)
        {
            var requestor = GetRequestRequestor(request);

            if (role == DefaultRole.LineManager)
            {
                var subject = $"Ellipse Access Request Rejected - {request.RequestNumber ?? request.Id.ToString()}";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/RejectedRequest.html");
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                   .Replace("{{rejection_reason}}", request.RejectionReason)
                   .Replace("{{rejector}}", _currentUser.DisplayName)
                   .Replace("{{req_type}}", request.RequestType);

                await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);
                return;
            }

            var lineManager = await GetRequestLineManager(request);
            if (role == DefaultRole.TrainingCentre)
            {
                var subject = "Ellipse Access Request Rejected - Training Not Verified";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/TrainingVerificationFailed.html");
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                   .Replace("{{rejection_reason}}", request.RejectionReason)
                   .Replace("{{rejector}}", _currentUser.DisplayName)
                   .Replace("{{req_type}}", request.RequestType);

                await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);

                emailBody = emailBody.Replace(requestor.ToString(), lineManager.ToString());
                await SendToEmailsAsync(new[] { lineManager?.Email }, subject, emailBody, request.Id, cancellationToken);

                return;
            }

            if (role == DefaultRole.IctManager)
            {
                var subject = $"Test/Development Access Request Rejected - {request.RequestNumber ?? request.Id.ToString()}";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/IctManagerRejection.html");
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                   .Replace("{{rejection_reason}}", request.RejectionReason)
                   .Replace("{{rejector}}", _currentUser.DisplayName)
                   .Replace("{{req_type}}", request.RequestType);

                await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);

                emailBody = emailBody.Replace(requestor.ToString(), lineManager.ToString());
                await SendToEmailsAsync(new[] { lineManager?.Email }, subject, emailBody, request.Id, cancellationToken);

                return;
            }

            if (role == DefaultRole.HcSystemsOfficer)
            {
                var subject = $"Ellipse Access Request Rejected - {request.RequestNumber}";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/HcOfficerRejectedRequest.html");
                var emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
                   .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
                   .Replace("{{rejection_reason}}", request.RejectionReason)
                   .Replace("{{rejector}}", _currentUser.DisplayName)
                   .Replace("{{req_type}}", request.RequestType);

                await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);

                emailBody = emailBody.Replace(requestor.ToString(), lineManager.ToString());
                await SendToEmailsAsync(new[] { lineManager?.Email }, subject, emailBody, request.Id, cancellationToken);

                return;
            }
        }

        public async Task NotifyImplementedAsync(Request request, CancellationToken cancellationToken = default)
        {
            var requestor = GetRequestRequestor(request);

            var lineManager = await GetRequestLineManager(request);
            var subject = $"Ellipse Access Successfully Implemented - {request.RequestNumber}";
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/AccessImplemented.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{implemented_date}}", request.DateAccessGranted?.ToString("yyyy-MM-dd"))
               .Replace("{{approver}}", _currentUser.DisplayName)
               .Replace("{{ellepsi_id}}", request.EllipseUserId)
               .Replace("{{environment}}", request.Environment)
               .Replace("{{req_type}}", request.RequestType);

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);

            emailBody = emailBody.Replace(requestor.ToString(), lineManager.ToString());
            await SendToEmailsAsync(new[] { lineManager?.Email }, subject, emailBody, request.Id, cancellationToken);
        }

        public async Task NotifyReturnForAmendmentAsync(Request request, string reason, CancellationToken cancellationToken = default)
        {
            var subject = $"Additional Information Required - {request.RequestNumber}";

            var documentsRequested = await _db.DocumentResubmissionRequests.AsNoTracking()
                .Where(d => d.RequestId == request.Id)
                .OrderByDescending(d => d.RequestedAt)
                .Select(d => d.DocumentsRequested)
                .FirstOrDefaultAsync(cancellationToken);

            var documentLines = (documentsRequested ?? "")
            .Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => "\u2022 " + item + "<br/>")
            .ToArray();

            var requestor = GetRequestRequestor(request);
            var lineManager = await GetRequestLineManager(request);
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/RequestAdditionalInformation.html");
            var emailBody = File.ReadAllText(templatePath);

            emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{implemented_date}}", request.DateAccessGranted?.ToString("yyyy-MM-dd"))
               .Replace("{{approver}}", _currentUser.DisplayName)
               .Replace("{{rejection_reason}}", reason)
               .Replace("{{missing_documents}}", string.Join(" ", documentLines));

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);

            emailBody = emailBody.Replace(requestor.ToString(), lineManager.ToString());
            await SendToEmailsAsync(new[] { lineManager?.Email }, subject, emailBody, request.Id, cancellationToken);
        }

        public async Task NotifyExpiryRemindersAsync(Request request, CancellationToken cancellationToken = default)
        {
            var daysRemaining = (request.EndDate!.Value.Date - DateTime.UtcNow.Date).Days;
            var requestor = GetRequestRequestor(request);
            var lineManager = await GetRequestLineManager(request);
            string subject;
            string emailBody;

            if (daysRemaining == 30)
            {
                subject = $"Access Expiry Notification - {request.RequestNumber}";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/AccessExpiryNotification.html");
                emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{environment}}", request.Environment)
               .Replace("{{end_date}}", request.EndDate?.ToLocalTime().ToString("yyyy-MM-dd"));
            }
            else if (daysRemaining == 7)
            {
                subject = $"Access Expiry Notification - {request.RequestNumber}";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/AccessExpiryNotification7Days.html");
                emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{environment}}", request.Environment)
               .Replace("{{end_date}}", request.EndDate?.ToLocalTime().ToString("yyyy-MM-dd"));
            }
            else if (daysRemaining <= 0)
            {
                subject = $"Access Expiry Notification - {request.RequestNumber}";
                var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Email Templates/AccessExpiredNotification.html");
                emailBody = File.ReadAllText(templatePath);

                emailBody = emailBody.Replace("{{name}}", requestor.ToString())
               .Replace("{{req_number}}", request.RequestNumber ?? request.Id.ToString())
               .Replace("{{environment}}", request.Environment)
               .Replace("{{end_date}}", request.EndDate?.ToLocalTime().ToString("yyyy-MM-dd"));
            }
            else
            {
                return; // job should not call for other day counts
            }

            await SendToEmailsAsync(new[] { requestor.GetEmailAddress() }, subject, emailBody, request.Id, cancellationToken);

            emailBody = emailBody.Replace("{{name}}", lineManager.ToString());

            await SendToEmailsAsync(new[] { lineManager.Email }, subject, emailBody, request.Id, cancellationToken);
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
                        IsHtml = true,
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
    }
}
