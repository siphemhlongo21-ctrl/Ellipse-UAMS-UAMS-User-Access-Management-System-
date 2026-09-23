using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;

namespace EUAMS.Core.Security
{
    public class RequestAccessService : IRequestAccessService
    {
        private static readonly HashSet<string> ClosedStatuses =
        [
            RequestStatus.Implemented.GetDescription(),
            RequestStatus.Rejected.GetDescription(),
            RequestStatus.Cancelled.GetDescription()
        ];

        private static readonly HashSet<string> EditableStatuses =
        [
            RequestStatus.Draft.GetDescription(),
            RequestStatus.ReturnForAmendment.GetDescription(),
            RequestStatus.PendingApproval.GetDescription(),
        ];

        private static readonly HashSet<string> TrainingQueue =
        [
            RequestStatus.TrainingVerificationPending.GetDescription()
        ];

        private static readonly HashSet<string> IctQueue =
        [
            RequestStatus.ICTManagerApprovalPending.GetDescription()
        ];

        private static readonly HashSet<string> HcQueue =
        [
            RequestStatus.HcActionPending.GetDescription()
        ];

        private readonly ICurrentUserService _currentUser;
        private readonly EuamsDbContext _db;

        public RequestAccessService(ICurrentUserService currentUser, EuamsDbContext db)
        {
            _currentUser = currentUser;
            _db = db;
        }

        public Task EnsureLoadedAsync(CancellationToken cancellationToken = default) =>
            _currentUser.EnsureLoadedAsync(cancellationToken);

        public bool IsRequestClosed(Request request) =>
            request.RequestClosed == true || ClosedStatuses.Contains(request.Status);

        public bool CanEditRequestContent(Request request)
        {
            if (IsRequestClosed(request) || !EditableStatuses.Contains(request.Status))
            {
                return false;
            }

            if (_currentUser.HasPermission(PermissionCodes.RequestSearchAll)
                || _currentUser.HasPermission(PermissionCodes.RequestImplement))
            {
                return true;
            }

            return IsOwn(request)
                   || (_currentUser.HasPermission(PermissionCodes.RequestCreateManaged) && IsOwnOrSubmitted(request));
        }

        public bool CanUploadDocuments(Request request)
        {
            if (IsRequestClosed(request))
            {
                return false;
            }

            if (_currentUser.HasPermission(PermissionCodes.RequestSearchAll)
                || _currentUser.HasPermission(PermissionCodes.RequestImplement)
                || _currentUser.HasPermission(PermissionCodes.RequestReturnForAmendment))
            {
                return true;
            }

            if (!EditableStatuses.Contains(request.Status))
            {
                return false;
            }

            return IsOwn(request)
                   || (_currentUser.HasPermission(PermissionCodes.RequestCreateManaged) && IsOwnOrSubmitted(request));
        }

        public IQueryable<Request> FilterViewable(IQueryable<Request> query)
        {
            if (_currentUser.HasPermission(PermissionCodes.RequestSearchAll))
            {
                return query;
            }

            var serviceNumber = _currentUser.ServiceNumber;
            var hasOwn = _currentUser.HasPermission(PermissionCodes.RequestViewOwn);
            var hasTeam = _currentUser.HasPermission(PermissionCodes.RequestViewTeam);
            // Queue visibility follows approval permissions (LINE_MANAGER has approve but not view.linked).
            var linkedLm = _currentUser.HasPermission(PermissionCodes.RequestApproveLineManager);
            var linkedTraining = _currentUser.HasPermission(PermissionCodes.RequestVerifyTraining);
            var linkedIct = _currentUser.HasPermission(PermissionCodes.RequestApproveIct);
            var linkedHc = _currentUser.HasAnyPermission(
                PermissionCodes.RequestImplement,
                PermissionCodes.RequestReturnForAmendment);
            var now = DateTime.UtcNow;

            // Approval queues are stage-open: any LM/Training/ICT/HC with the action
            // permission sees all requests at that status (including base EMPLOYEE submits).
            // EmployeeManagers only scopes RequestViewTeam browsing, not approve/reject.
            // Actors who already took an approver action keep visibility after the request
            // leaves their queue so status / audit trail can refresh on the UI.
            return query.Where(r =>
                (hasOwn && (_currentUser.ServiceNumber != null && r.SubmittedByServiceNumber == _currentUser.ServiceNumber))
                || (linkedLm && r.Status == RequestStatus.PendingApproval.GetDescription())
                || (linkedTraining && r.Status == RequestStatus.TrainingVerificationPending.GetDescription())
                || (linkedIct && r.Status == RequestStatus.ICTManagerApprovalPending.GetDescription())
                || (linkedHc && r.Status == RequestStatus.HcActionPending.GetDescription())
                || (_currentUser.ServiceNumber != null
                && _db.RequestApproverActions.Any(a => a.RequestId == r.Id && a.ActionerServiceNumber == _currentUser.ServiceNumber)));
        }

        public void EnsureCanEdit(Request request)
        {
            if (!CanEditRequestContent(request))
            {
                throw new UnauthorizedAccessException("You cannot edit this request in its current state.");
            }
        }

        public void EnsureCanUpload(Request request)
        {
            if (!CanUploadDocuments(request))
            {
                throw new UnauthorizedAccessException("You cannot upload documents for this request.");
            }
        }

        public void EnsureNotClosed(Request request)
        {
            if (IsRequestClosed(request))
            {
                throw new InvalidOperationException("Closed requests are immutable.");
            }
        }

        private bool IsOwn(Request request)
        {
            if (_currentUser.ServiceNumber is not null
                && request.SubmittedByServiceNumber == _currentUser.ServiceNumber)
            {
                return true;
            }

            return false;
        }

        private bool IsOwnOrSubmitted(Request request) => IsOwn(request);

        private bool IsInCallerQueue(Request request)
        {
            if (_currentUser.HasPermission(PermissionCodes.RequestApproveLineManager)
                && request.Status == RequestStatus.PendingApproval.GetDescription())
            {
                return true;
            }

            if (_currentUser.HasPermission(PermissionCodes.RequestVerifyTraining)
                && TrainingQueue.Contains(request.Status))
            {
                return true;
            }

            if (_currentUser.HasPermission(PermissionCodes.RequestApproveIct)
                && IctQueue.Contains(request.Status))
            {
                return true;
            }

            if (_currentUser.HasAnyPermission(
                    PermissionCodes.RequestImplement,
                    PermissionCodes.RequestReturnForAmendment)
                && HcQueue.Contains(request.Status))
            {
                return true;
            }

            return _db.RequestApproverActions.Any(a => a.RequestId == request.Id && a.ActionerServiceNumber == _currentUser.ServiceNumber);
        }
    }
}
