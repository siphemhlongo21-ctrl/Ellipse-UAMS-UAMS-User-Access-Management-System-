using EUAMS.Core.Extensions;
using EUAMS.Core.Notifications;
using EUAMS.Core.Security;
using EUAMS.Core.Workflow;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Contractor;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.DTOs.Request;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EUAMS.Core.Services
{
    public class RequestServices : IRequestServices
    {
        private static readonly HashSet<string> TemporaryAccessTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Temporary",
            "TemporaryActing",
            "Temporary/Acting",
            "Acting"
        };

        private static readonly HashSet<string> TemporaryRequestTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Temporary Position Amendment",
            "Acting Position Amendment",
            "Temporary/Acting Position Amendment",
            "Temporary / Acting position assignment",
            "TEMP_POS_AMEND",
            "ACTING_POS_AMEND"
        };

        private readonly EuamsDbContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly RequestWorkflowWriter _workflow;
        private readonly RequestNotificationService _notifications;
        private readonly IRequestAccessService _access;
        private readonly ILogger<RequestServices> _logger;
        private readonly ILookupUSTEmployeeServices _uSTEmployeeServices;

        public RequestServices(
            EuamsDbContext context,
            ICurrentUserService currentUser,
            RequestWorkflowWriter workflow,
            RequestNotificationService notifications,
            IRequestAccessService access,
            ILogger<RequestServices> logger,
            ILookupUSTEmployeeServices uSTEmployeeServices)
        {
            _context = context;
            _currentUser = currentUser;
            _workflow = workflow;
            _notifications = notifications;
            _access = access;
            _logger = logger;
            _uSTEmployeeServices = uSTEmployeeServices;
        }

        public async Task<List<RequestDetails>> GetRequests()
        {
            await _access.EnsureLoadedAsync();
            var requests = await _access.FilterViewable(
                    _context.Requests
                        .Include(r => r.Employee)
                        .Include(r => r.Contractor)
                        .Include(r => r.DocumentResubmissionRequests)
                        .AsNoTracking())
                .OrderByDescending(r => r.RequestedDate)
                .ToListAsync();

            var details = requests.ToListDetails();
            await EnrichAmendmentFieldsAsync(details);
            return details;
        }

        public async Task<RequestDetails?> GetRequest(int requestId)
        {
            await _access.EnsureLoadedAsync();
            var request = await _context.Requests
                .Include(r => r.Employee)
                .Include(r => r.Contractor)
                .Include(r => r.DocumentResubmissionRequests)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request is null)
            {
                return null;
            }

            var details = request.ToDetails();
            await EnrichAmendmentFieldsAsync(new List<RequestDetails> { details });
            return details;
        }

        public async Task<List<RequestDetails>> SearchRequest(string searchString)
        {
            await _access.EnsureLoadedAsync();
            var query = _access.FilterViewable(
                _context.Requests
                    .Include(r => r.Employee)
                    .Include(r => r.Contractor)
                    .AsNoTracking());

            if (!string.IsNullOrWhiteSpace(searchString))
            {
                var term = searchString.Trim().ToLower();
                var idParsed = int.TryParse(term, out var requestId);

                query = query.Where(r =>
                    (idParsed && r.Id == requestId)
                    || r.Id.ToString().Contains(term)
                    || (r.RequestNumber != null && r.RequestNumber.ToLower().Contains(term))
                    || (r.EmployeeEmail != null && r.EmployeeEmail.ToLower().Contains(term))
                    || (r.Employee != null && (
                        r.Employee.FirstName.ToLower().Contains(term)
                        || r.Employee.Surname.ToLower().Contains(term)
                        || (r.Employee.FirstName + " " + r.Employee.Surname).ToLower().Contains(term)
                        || r.Employee.Department.ToLower().Contains(term)
                        || r.Employee.ServiceNumber.ToLower().Contains(term)))
                    || (r.Contractor != null && (
                        (r.Contractor.FirstName != null && r.Contractor.FirstName.ToLower().Contains(term))
                        || (r.Contractor.Surname != null && r.Contractor.Surname.ToLower().Contains(term))
                        || ((r.Contractor.FirstName ?? "") + " " + (r.Contractor.Surname ?? "")).ToLower().Contains(term)
                        || (r.Contractor.Department != null && r.Contractor.Department.ToLower().Contains(term)))));
            }

            var requests = await query.OrderByDescending(r => r.RequestedDate).ToListAsync();
            var details = requests.ToListDetails();
            await EnrichAmendmentFieldsAsync(details);
            return details;
        }

        public async Task<List<RequestDetails>> GetEmployeeRequestsByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email is required.", nameof(email));
            }

            var normalizedEmail = email.Trim();
            return await GetRequestsForEmployeeEmailsAsync(new[] { normalizedEmail });
        }

        public async Task<List<RequestDetails>> GetEmployeeRequestsByServiceNumber(string serviceNumber)
        {
            if (string.IsNullOrWhiteSpace(serviceNumber))
            {
                throw new ArgumentException("Service number is required.", nameof(serviceNumber));
            }

            var employee = await _uSTEmployeeServices.GetEmployeeDetailsByServiceNumber(serviceNumber.Trim());
            if (string.IsNullOrWhiteSpace(employee.Email))
            {
                return new List<RequestDetails>();
            }

            return await GetRequestsForEmployeeEmailsAsync(new[] { employee.Email });
        }

        public async Task<List<RequestDetails>> GetLineManagerRequestsByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email is required.", nameof(email));
            }

            var manager = await _uSTEmployeeServices.GetEmployeeDetailsByEmail(email.Trim());

            if (string.IsNullOrWhiteSpace(manager.ServiceNo))
            {
                return new List<RequestDetails>();
            }

            return await GetLineManagerRequestsByServiceNumber(manager.ServiceNo);
        }

        public async Task<List<RequestDetails>> GetLineManagerRequestsByServiceNumber(string serviceNumber)
        {
            if (string.IsNullOrWhiteSpace(serviceNumber))
            {
                throw new ArgumentException("Service number is required.", nameof(serviceNumber));
            }

            var reportToManager = await _uSTEmployeeServices
                .GetEmployeesReportingToManagerByManagerServiceNumber(serviceNumber.Trim());

            var emails = reportToManager.Select(e => e.Email).ToList();

            var requests = await GetRequestsForEmployeeEmailsAsync(emails);
            var requestsCreatedByLineManager = _context.Requests
                .Include(o => o.Contractor)
                .Include(o => o.Employee)
				.Include(r => r.DocumentResubmissionRequests)
				.AsNoTracking()
                .Where(o => (o.Contractor != null && o.Contractor.ResponsibleManager == serviceNumber) || o.SubmittedByServiceNumber == serviceNumber);
            var allRequests = requests;

            foreach (var request in requestsCreatedByLineManager)
            {
                var duplicateRequest = requests.FirstOrDefault(o => o.Id == request.Id);

                if (duplicateRequest == null)
                {
                    requests.Add(request.ToDetails());
                }
            }

            return requests.OrderByDescending(o => o.RequestedDate).ToList();
        }

        private async Task<Request?> ValidateRequest(NewRequestDetails details, string requestType)
        {
            var request = await _context.Requests
                    .Include(o => o.Employee)
                    .Include(o => o.Contractor)
                    .FirstOrDefaultAsync(o => o.RequestType.ToLower() == requestType.ToLower() && o.Status != RequestStatus.Implemented.GetDescription() &&
                    ((o.Employee != null && details.Employee != null && o.Employee.EmailAddress.ToLower() == details.Employee.EmailAddress.ToLower()) ||
                    (o.Contractor != null && details.Contractor != null && o.Contractor.EmailAddress.ToLower() == details.Contractor.EmailAddress.ToLower()))
                    && (!string.IsNullOrEmpty(o.UserAccessType) && !string.IsNullOrEmpty(details.UserAccessType) && o.UserAccessType.ToLower() == details.UserAccessType.ToLower())
                    && (!string.IsNullOrEmpty(details.Environment) && !string.IsNullOrEmpty(o.Environment) && o.Environment.ToLower() == details.Environment.ToLower()));

            if (request != null)
            {
                throw new Exception($"Duplicate request, please check {request.RequestNumber}...");
            }

            return request;
        }

        private async Task AddRequestEmployyeDetails(EmployeeDetails employeeDetails, Request request)
        {
            var employee = await _context.Employees
                            .FirstOrDefaultAsync(o => o.EmailAddress == employeeDetails!.EmailAddress);

            if (employee == null)
            {
                employee = employeeDetails!.ToEntity();
                await _context.Employees.AddAsync(employee);
            }
            else
            {
                employee.ActiveDirectoryUsername = employeeDetails!.ActiveDirectoryUsername;
                employee.FirstName = employeeDetails.FirstName;
                employee.Surname = employeeDetails.Surname;
                employee.ContactNumber = employeeDetails.ContactNumber;
                employee.Department = employeeDetails.Department;
                employee.Branch = employeeDetails.Branch;
                employee.Designation = employeeDetails.Designation;
                employee.PostId = employeeDetails.PostId;
            }

            await _context.SaveChangesAsync();

            request.EmployeeEmail = employee.EmailAddress;
            request.Employee = employee;

            await _context.SaveChangesAsync();
        }

        private async Task AddRequestContractorDetails(ContractorDetails contractorDetails, Request request)
        {
            var contractorEmail = contractorDetails.EmailAddress;
            var contractor = await _context.Contractors
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.EmailAddress == contractorEmail);

            if (contractor is null)
            {
                contractor = contractorDetails.ToEntity();
                await _context.Contractors.AddAsync(contractor);
                await _context.SaveChangesAsync();
            }
            else
            {
                contractor.StartDate = contractorDetails.StartDate;
                contractor.EndDate = contractorDetails.EndDate;
                contractor.Branch = contractorDetails.Branch;
                contractor.Department = contractorDetails.Department;
                contractor.CompanyName = contractorDetails.CompanyName;
                contractor.FirstName = contractorDetails.FirstName;
                contractor.Surname = contractorDetails.Surname;
            }

            contractor.ResponsibleManager = _currentUser.ServiceNumber;

            request.ContractId = contractor.Id;
            request.Contractor = contractor;

            await _context.SaveChangesAsync();
        }

        private RequestStatusHistory CreateRequestStatusHistory(Request request)
        {
            return new RequestStatusHistory
            {
                RequestId = request.Id,
                ToStatus = request.Status,
                Event = "Request Created",
                Reason = "A new request has been created",
                ChangedByServiceNumber = _currentUser.ServiceNumber,
                ChangedAt = DateTime.UtcNow
            };
        }

        public async Task<RequestDetails> CreateRequest(NewRequestDetails details)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    await _currentUser.EnsureLoadedAsync();

                    var requestType = await ResolveRequestTypeName(details.RequestType.Trim());
                    var request = await ValidateRequest(details, requestType);

                    request = details.ConvertToNewRequest(requestType, _currentUser);

                    _context.Requests.Add(request);
                    await _context.SaveChangesAsync();

                    if (details.UserType == UserType.Employee.GetDescription() && details.Employee != null)
                    {
                        await AddRequestEmployyeDetails(details.Employee, request);
                    }

                    if (details.UserType == UserType.Contractor.GetDescription() && details.Contractor != null)
                    {
                        await AddRequestContractorDetails(details.Contractor, request);
                    }

                    request.RequestNumber = $"REQ-{request.RequestedDate:yyyyMMdd}-{request.Id:D6}";

                    await _context.RequestStatusHistories.AddAsync(CreateRequestStatusHistory(request));
                    await _context.SaveChangesAsync();
                    await NotifySafeAsync(() => _notifications.NotifySubmittedAsync(request, request.Status == RequestStatus.PendingApproval.GetDescription()));

                    if (request.Status != RequestStatus.PendingApproval.GetDescription())
                    {
                        await NotifySafeAsync(() => _notifications.NotifyStepAdvancedAsync(request, StatusHistoryEvent.LineManagerCreatedRequest));
                    }

                    await transaction.CommitAsync();

                    return (await GetRequest(request.Id))!;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        private async Task<List<RequestDetails>> GetRequestsForEmployeeEmailsAsync(IEnumerable<string> emails)
        {
            var emailList = emails
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (emailList.Count == 0)
            {
                return new List<RequestDetails>();
            }

            var emailSetLower = emailList
                .Select(e => e.ToLowerInvariant())
                .ToList();

            await _access.EnsureLoadedAsync();

            var requests = await _context.Requests
                        .Include(r => r.Employee)
                        .Include(r => r.Contractor)
						.Include(r => r.DocumentResubmissionRequests)
						.AsNoTracking()
                        .Where(r => (r.EmployeeEmail != null
                                    && emailSetLower.Contains(r.EmployeeEmail.ToLower()))
                                    || emails.Contains(r.SubmittedByServiceNumber))
                .OrderByDescending(r => r.RequestedDate)
                .ToListAsync();

            var details = requests.ToListDetails();
            await EnrichAmendmentFieldsAsync(details);
            return details;
        }

        public async Task<RequestDetails> UpdateRequest(RequestDetails requestDetails)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestDetails.Id);
            _access.EnsureCanEdit(request);

            var isTemporaryAccess = !string.IsNullOrWhiteSpace(requestDetails.UserAccessType)
                              && TemporaryAccessTypes.Contains(requestDetails.UserAccessType);
            var isTemporaryRequestType = TemporaryRequestTypes.Contains(requestDetails.RequestType ?? string.Empty);
            var isContractor = requestDetails.UserType.Equals(UserType.Contractor.GetDescription(), StringComparison.OrdinalIgnoreCase);
            var endDate = requestDetails.EndDate;
            if (!isTemporaryAccess && !isTemporaryRequestType && !isContractor)
            {
                endDate = null;
            }

            request.StartDate = requestDetails.StartDate;
            request.EndDate = endDate;
            request.RequestType = await ResolveRequestTypeName(requestDetails.RequestType);
            request.UserAccessType = requestDetails.UserAccessType;
            request.EllipsePosition = requestDetails.EllipsePosition;
            request.PositionToCopy = requestDetails.PositionToCopy;
            request.MenuAccess = requestDetails.MenuAccess;
            request.BusinessJustification = requestDetails.BusinessJustification;
            request.AdditionalUserAccess = requestDetails.AdditionalUserAccess;
            request.TemporaryPosition = requestDetails.TemporaryPosition;
            request.TemporaryPostId = requestDetails.TemporaryPostId;

            await _context.SaveChangesAsync();
            return request.ToDetails();
        }

        public async Task<bool> LineManagerRequestApproval(int requestId)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.PendingApproval);

            var from = request.Status;
            var to = request.Environment == Environments.Production.GetDescription()
                ? RequestStatus.TrainingVerificationPending
                : RequestStatus.ICTManagerApprovalPending;

            request.LineManagerApproved = true;
            request.RejectionReason = null;
            request.Status = to.GetDescription();

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.LineManager, ApproverActionType.Approve);
            await _workflow.AddStatusHistoryAsync(request.Id, from, to, StatusHistoryEvent.LineManagerApproved);
            await _context.SaveChangesAsync();

            request.LineManagerApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() =>
            _notifications.NotifyStepAdvancedAsync(request, StatusHistoryEvent.LineManagerApproved));

            return true;
        }

        public async Task<bool> LineManagerRequestRejection(int requestId, string? rejectionReason = null)
        {

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    await _access.EnsureLoadedAsync();
                    var request = await LoadTrackedRequestAsync(requestId);
                    EnsureStatus(request, RequestStatus.PendingApproval);

                    var from = request.Status;
                    request.LineManagerApproved = false;
                    request.RejectionReason = rejectionReason;
                    request.RequestClosed = true;
                    request.ClosureOutcome = ClosureOutcome.RejectedByLineManager.GetDescription();
                    request.Status = RequestStatus.Rejected.GetDescription();

                    var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.LineManager, ApproverActionType.Reject);
                    await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.Rejected, StatusHistoryEvent.LineManagerRejected, rejectionReason);
                    await _context.SaveChangesAsync();

                    request.LineManagerApprovalServiceNumber = action.ActionerServiceNumber;
                    await _context.SaveChangesAsync();

                    await NotifySafeAsync(() => _notifications.NotifyRejectedAsync(DefaultRole.LineManager, request));

                    await transaction.CommitAsync();

                    return true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        public async Task<bool> TrainingCenterRequestVerification(
     int requestId,
     DateTime trainingDate,
     string? verifiedBy = null)
        {
            await _access.EnsureLoadedAsync();

            var request = await LoadTrackedRequestAsync(requestId);

            EnsureStatus(
                request,
                RequestStatus.TrainingVerificationPending);

            if (request.Environment != Environments.Production.GetDescription())
            {
                throw new InvalidOperationException(
                    "Training verification is only required for Production requests.");
            }

            if (trainingDate == default)
            {
                throw new ArgumentException(
                    "Training date is required before training can be verified.",
                    nameof(trainingDate));
            }

            if (trainingDate.Date > DateTime.Today)
            {
                throw new ArgumentException(
                    "Training date must be today going back. " +
                    "Future dates are not allowed.",
                    nameof(trainingDate));
            }

            var from = request.Status;

            request.TrainingVerified = true;
            request.TrainingCompletionDate = trainingDate.Date;
            request.Status = RequestStatus.HcActionPending.GetDescription();

            _context.TrainingVerifications.Add(new TrainingVerification
            {
                RequestId = request.Id,
                TrainingCompleted = true,
                TrainingCompletionDate = trainingDate.Date,
                VerifiedByName = verifiedBy ?? _currentUser.ServiceNumber,
                VerifiedByServiceNumber = _currentUser.ServiceNumber,
                ActionDate = DateTime.UtcNow
            });

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.TrainingCentre, ApproverActionType.TrainingVerified);

            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.HcActionPending, StatusHistoryEvent.TrainingVerified,
                $"Training completed on {trainingDate:yyyy-MM-dd}");

            await _context.SaveChangesAsync();

            request.TrainingApprovalServiceNumber = action.ActionerServiceNumber;

            await _context.SaveChangesAsync();

            await NotifySafeAsync(() =>
                _notifications.NotifyStepAdvancedAsync(request, StatusHistoryEvent.TrainingVerified));

            return true;
        }

        public async Task<bool> TrainingCenterRequestUnverified(int requestId, string? rejectionReason = null)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.TrainingVerificationPending);

            var from = request.Status;
            request.TrainingVerified = false;
            request.RejectionReason = rejectionReason;
            request.RequestClosed = true;
            request.ClosureOutcome = ClosureOutcome.RejectedByTrainingCentre.GetDescription();
            request.Status = RequestStatus.Rejected.GetDescription();

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.TrainingCentre, ApproverActionType.RejectTraining);
            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.Rejected, StatusHistoryEvent.TrainingUnverified, rejectionReason);
            await _context.SaveChangesAsync();

            request.TrainingApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() => _notifications.NotifyRejectedAsync(DefaultRole.TrainingCentre, request));

            return true;
        }

        public async Task<bool> ICTManagerRequestApproval(int requestId)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.ICTManagerApprovalPending);

            var from = request.Status;
            request.ICTManagerApproved = true;
            request.RejectionReason = null;
            request.Status = RequestStatus.HcActionPending.GetDescription();

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.IctManager, ApproverActionType.Approve);
            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.HcActionPending, StatusHistoryEvent.ICTManagerApproved);
            await _context.SaveChangesAsync();

            request.ICTManagerApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() => _notifications.NotifyStepAdvancedAsync(request, StatusHistoryEvent.ICTManagerApproved));

            return true;
        }

        public async Task<bool> ICTManagerRequestRejection(int requestId, string? rejectionReason = null)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.ICTManagerApprovalPending);

            var from = request.Status;
            request.ICTManagerApproved = false;
            request.RejectionReason = rejectionReason;
            request.RequestClosed = true;
            request.ClosureOutcome = ClosureOutcome.RejectedByIctManager.GetDescription();
            request.Status = RequestStatus.Rejected.GetDescription();

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.IctManager, ApproverActionType.Reject);
            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.Rejected, StatusHistoryEvent.ICTManagerRejected, rejectionReason);
            await _context.SaveChangesAsync();

            request.ICTManagerApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() => _notifications.NotifyRejectedAsync(DefaultRole.IctManager, request));

            return true;
        }

        public async Task<bool> HcSystemsOfficerRequestImplementation(int requestId, ImplementRequestDetails details)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.HcActionPending);
            object value = await EnsureReadyForHcAsync(request);

            if (string.IsNullOrEmpty(details.EllipseUserId))
            {
                throw new ArgumentException("Ellipse User ID is required.", nameof(details));
            }

            if (string.IsNullOrWhiteSpace(details.ImplementationComments))
            {
                throw new ArgumentException("Implementation comments are required.", nameof(details));
            }

            if (details.MandatoryInformationVerified != true)
            {
                throw new ArgumentException("Mandatory information must be verified before implementation.", nameof(details));
            }

            var isContractor = string.Equals(request.UserType, "Contractor", StringComparison.OrdinalIgnoreCase);
            if (isContractor && details.ContractorDocumentsVerified != true)
            {
                throw new ArgumentException("Contractor documents must be verified before implementation.", nameof(details));
            }

            await _currentUser.EnsureLoadedAsync();

            var from = request.Status;
            request.EllipseUserId = details.EllipseUserId;
            request.DateAccessGranted = details.DateAccessGranted;
            request.EllipseUserUpdateDate = details.EllipseUserUpdateDate ?? details.DateAccessGranted;
            request.ImplementationComments = details.ImplementationComments.Trim();
            request.ClosureOutcome = string.IsNullOrWhiteSpace(details.ClosureOutcome)
                ? ClosureOutcome.Implemented.GetDescription()
                : details.ClosureOutcome.Trim();
            request.ImplementedByServiceNumber = _currentUser.ServiceNumber;
            request.MandatoryInformationVerified = details.MandatoryInformationVerified;
            request.ContractorDocumentsVerified = isContractor && details.ContractorDocumentsVerified;
            request.HCSystemsAdminApproved = true;
            request.RequestClosed = true;
            request.Status = RequestStatus.Implemented.GetDescription();

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.HcSystemsOfficer, ApproverActionType.Implement);
            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.Implemented, StatusHistoryEvent.HcOfficerImplemented);
            await _context.SaveChangesAsync();

            request.HcSystemOfficerApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() => _notifications.NotifyImplementedAsync(request));

            return true;
        }

        public async Task<bool> HcSystemsOfficerRequestRejection(int requestId, string? rejectionReason = null)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.HcActionPending);

            var from = request.Status;
            request.HCSystemsAdminApproved = false;
            request.RejectionReason = rejectionReason;
            request.RequestClosed = true;
            request.ClosureOutcome = ClosureOutcome.RejectedByHcSystemsOfficer.GetDescription();
            request.Status = RequestStatus.Rejected.GetDescription();

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.HcSystemsOfficer, ApproverActionType.Reject);
            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.Rejected, StatusHistoryEvent.HcOfficerRejected, rejectionReason);
            await _context.SaveChangesAsync();

            request.HcSystemOfficerApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() => _notifications.NotifyRejectedAsync(DefaultRole.HcSystemsOfficer, request));

            return true;
        }

        public async Task<bool> ReturnForAmendment(int requestId, ReturnForAmendmentDetails details)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.HcActionPending);

            if (string.IsNullOrWhiteSpace(details.Reason))
            {
                throw new ArgumentException("Reason is required for return for amendment.", nameof(details));
            }

            var amendmentType = string.IsNullOrWhiteSpace(details.AmendmentType)
                ? "AmendmentRequired"
                : details.AmendmentType.Trim();
            var reason = $"{amendmentType}: {details.Reason.Trim()}";
            var documentsRequested = string.IsNullOrWhiteSpace(details.DocumentsRequested)
                ? amendmentType
                : details.DocumentsRequested.Trim();

            await _currentUser.EnsureLoadedAsync();

            if (_currentUser.ServiceNumber is null)
            {
                throw new UnauthorizedAccessException("Authenticated AppUser is required.");
            }

            var from = request.Status;
            request.MissingDocuments = amendmentType.Contains("Missing", StringComparison.OrdinalIgnoreCase);
            request.RejectionReason = null;
            request.RequestClosed = false;
            request.Status = RequestStatus.ReturnForAmendment.GetDescription();

            _context.DocumentResubmissionRequests.Add(new DocumentResubmissionRequest
            {
                RequestId = request.Id,
                RequestedByServiceNumber = _currentUser.ServiceNumber,
                Reason = reason,
                DocumentsRequested = documentsRequested,
                Status = "Open",
                RequestedAt = DateTime.UtcNow
            });

            var action = await _workflow.AddApproverActionAsync(request.Id, DefaultRole.HcSystemsOfficer,
                ApproverActionType.ReturnForAmendment);
            await _workflow.AddStatusHistoryAsync(
                request.Id,
                from,
                RequestStatus.ReturnForAmendment,
                StatusHistoryEvent.ReturnForAmendment,
                reason);
            await _context.SaveChangesAsync();

            request.HcSystemOfficerApprovalServiceNumber = action.ActionerServiceNumber;
            await _context.SaveChangesAsync();

            string? lineManagerServiceNumber = null;
            try
            {
                var manager = await _uSTEmployeeServices.GetEmployeeManagerDetailsByEmployeeEmail(
                    request.Employee?.EmailAddress ?? request.Contractor?.EmailAddress ?? "");
                lineManagerServiceNumber = manager.ServiceNo;
            }
            catch
            {
               
            }

            await NotifySafeAsync(() => _notifications.NotifyReturnForAmendmentAsync(request, reason));

            await _workflow.AddStatusHistoryAsync(request.Id, RequestStatus.ReturnForAmendment.GetDescription(),
                RequestStatus.ReturnForAmendment, StatusHistoryEvent.ReturnForAmendment,
                $"Notified Employee={request.Employee?.EmailAddress ?? request.Contractor?.EmailAddress ?? "(none)"}; LineManager={lineManagerServiceNumber}");
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ResubmitAmendment(int requestId)
        {
            await _access.EnsureLoadedAsync();
            var request = await LoadTrackedRequestAsync(requestId);
            EnsureStatus(request, RequestStatus.ReturnForAmendment);
            _access.EnsureCanEdit(request);

            await EnsureContractorDocumentGateAsync(request);

            var from = request.Status;
            request.MissingDocuments = false;
            request.Status = RequestStatus.HcActionPending.GetDescription();
            request.MandatoryInformationVerified = false;
            request.ContractorDocumentsVerified = false;
            request.HCSystemsAdminApproved = null;

            var openResubmissions = await _context.DocumentResubmissionRequests
                .Where(r => r.RequestId == requestId && r.Status == "Open")
                .ToListAsync();
            foreach (var item in openResubmissions)
            {
                item.Status = "Completed";
                item.CompletedAt = DateTime.UtcNow;
            }
            var approverRole = request.SubmittedByServiceNumber == _currentUser.ServiceNumber ? DefaultRole.Employee : DefaultRole.LineManager;
            await _currentUser.EnsureLoadedAsync();
            await _workflow.AddApproverActionAsync(request.Id, approverRole, ApproverActionType.AmendmentResubmit);
            await _workflow.AddStatusHistoryAsync(request.Id, from, RequestStatus.HcActionPending, StatusHistoryEvent.ResubmittedAmendment);
            await _context.SaveChangesAsync();

            await NotifySafeAsync(() =>
            _notifications.NotifyStepAdvancedAsync(request, StatusHistoryEvent.ResubmittedAmendment));

            return true;
        }

        private async Task EnrichAmendmentFieldsAsync(List<RequestDetails> details)
        {
            if (details.Count == 0)
            {
                return;
            }

            var amendmentIds = details
                .Where(d => string.Equals(d.Status, RequestStatus.ReturnForAmendment.ToString(), StringComparison.OrdinalIgnoreCase))
                .Select(d => d.Id)
                .ToList();
            if (amendmentIds.Count == 0)
            {
                return;
            }

            var openRows = await _context.DocumentResubmissionRequests.AsNoTracking()
                .Where(r => amendmentIds.Contains(r.RequestId) && r.Status == "Open")
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();

            var latestByRequest = openRows
                .GroupBy(r => r.RequestId)
                .ToDictionary(g => g.Key, g => g.First());

            foreach (var detail in details)
            {
                if (!latestByRequest.TryGetValue(detail.Id, out var row))
                {
                    continue;
                }

                detail.AmendmentReason = row.Reason;
                detail.DocumentsRequested = row.DocumentsRequested;
            }
        }

        private async Task NotifySafeAsync(Func<Task> notify)
        {
            try
            {
                await notify();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Request notification failed (non-blocking).");
            }
        }

        private async Task<Request> LoadTrackedRequestAsync(int requestId)
        {
            var request = await _context.Requests
                .Include(o => o.Employee)
                .Include(o => o.Contractor)
				.Include(r => r.DocumentResubmissionRequests)
				.FirstOrDefaultAsync(r => r.Id == requestId);

            if (request is null)
            {
                throw new KeyNotFoundException($"Request {requestId} was not found.");
            }

            return request;
        }

        private static void EnsureStatus(Request request, RequestStatus expected)
        {
            if (request.Status != expected.GetDescription())
            {
                throw new InvalidOperationException(
                    $"Request must be in status {expected.GetDescription()}, but was {request.Status}.");
            }
        }

        private async Task<string> ResolveRequestTypeName(string? requestType)
        {
            if (string.IsNullOrWhiteSpace(requestType))
            {
                throw new ArgumentNullException("Request type cannot be null");
            }

            var match = await _context.RequestTypes.AsNoTracking()
                .Where(rt => rt.IsActive)
                .FirstOrDefaultAsync(rt =>
                    rt.Name.ToLower() == requestType.ToLower()
                    || rt.Code.ToLower() == requestType.ToLower());

            if (match is null)
            {
                throw new KeyNotFoundException($"Request type {requestType} cannot be found");
            }

            return match.Name;
        }

        private async Task EnsureContractorDocumentGateAsync(Request request)
        {
            if (!string.Equals(request.UserType, "Contractor", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
           
            if ((request.RequestType ?? string.Empty).Contains("terminate", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var types = await _context.Documents.AsNoTracking()
                .Where(d => d.RequestId == request.Id && d.IsActive && !d.Archived)
                .Select(d => d.DocumentType)
                .ToListAsync();

            static bool HasAny(IEnumerable<string> docs, params string[] aliases) =>
                docs.Any(d => aliases.Any(a => d.Equals(a, StringComparison.OrdinalIgnoreCase)
                                               || d.Contains(a, StringComparison.OrdinalIgnoreCase)));

            var hasIdentity = HasAny(types, "Identity Document", "Passport", "ID Passport", "IDPassport", "ID");
            var hasContractorCard = HasAny(types, "Contractor Identification Card", "Contractor ID Card", "ContractorIdCard");

            if (!hasIdentity || !hasContractorCard)
            {
                throw new InvalidOperationException(
                    "Contractor requests require mandatory supporting documents before submit: " +
                    "Identity Document or Passport, and Contractor Identification Card. " +
                    "Contract Documentation should be attached where applicable.");
            }
        }

        public async Task<List<RequestDetails>> GetICTManagerRequestsAsync()
        {
            var requests = await _context.Requests.AsNoTracking()
                .Include(o => o.Contractor)
                .Include(o => o.Employee)
                .Where(x => x.Status == RequestStatus.ICTManagerApprovalPending.GetDescription())
                .ToListAsync();

            return requests.ToListDetails().OrderByDescending(o => o.RequestedDate).ToList();
        }

        public async Task<List<RequestDetails>> GetTrainingCenterRequestsAsync()
        {
            var requests = await _context.Requests.AsNoTracking()
                .Include(o => o.Contractor)
                .Include(o => o.Employee)
                .Where(x => x.Status == RequestStatus.TrainingVerificationPending.GetDescription())
                .ToListAsync();

            return requests.ToListDetails();
        }

        public async Task<List<RequestDetails>> GetHcSystemsOfficerRequestsAsync()
        {
            var requests = await _context.Requests.AsNoTracking()
                .Include(o => o.Contractor)
                .Include(o => o.Employee)
                .Where(x => x.Status == RequestStatus.HcActionPending.GetDescription())
                .ToListAsync();

            return requests.ToListDetails().OrderByDescending(o => o.RequestedDate).ToList();
        }

        public async Task<object?> EnsureReadyForHcAsync(Request request)
        {
            await EnsureContractorDocumentGateAsync(request);

            var isTerminationRequest = (request.RequestType ?? string.Empty).Contains("terminate", StringComparison.OrdinalIgnoreCase);
            if (!isTerminationRequest && string.Equals(request.Environment, Environments.Production.GetDescription(), StringComparison.OrdinalIgnoreCase))
            {
                if (!request.TrainingVerified.GetValueOrDefault(false))
                {
                    throw new InvalidOperationException("Training must be verified for Production requests before HC implementation.");
                }
            }

            return null;
        }
    }
}