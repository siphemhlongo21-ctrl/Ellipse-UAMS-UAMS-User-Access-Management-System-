using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Workflow
{
    public class RequestWorkflowWriter
    {
        private readonly EuamsDbContext _db;
        private readonly ICurrentUserService _currentUser;
        private readonly DLRDbContext _dLRDbContext;

        public RequestWorkflowWriter(EuamsDbContext db, ICurrentUserService currentUser, DLRDbContext dLRDbContext)
        {
            _db = db;
            _currentUser = currentUser;
            _dLRDbContext = dLRDbContext;
        }

        public async Task AddStatusHistoryAsync(int requestId, string? fromStatus, RequestStatus toStatus,
            StatusHistoryEvent statusHistoryEvent, string? reason = null, CancellationToken cancellationToken = default)
        {
            await _currentUser.EnsureLoadedAsync(cancellationToken);

            _db.RequestStatusHistories.Add(new RequestStatusHistory
            {
                RequestId = requestId,
                FromStatus = fromStatus,
                ToStatus = toStatus.GetDescription(),
                Event = statusHistoryEvent.GetDescription(),
                Reason = reason,
                ChangedByServiceNumber = _currentUser.ServiceNumber,
                ChangedAt = DateTime.UtcNow
            });
        }

        public async Task<RequestApproverAction> AddApproverActionAsync(int requestId, DefaultRole role,
            ApproverActionType actionType, CancellationToken cancellationToken = default)
        {
            await _currentUser.EnsureLoadedAsync(cancellationToken);

            var employee = await _dLRDbContext.DrlEmployeeDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.SERVICE_NO == _currentUser.ServiceNumber, cancellationToken);

            if (employee == null)
            {
                throw new KeyNotFoundException($"Employee {_currentUser.ServiceNumber} was not found");
            }

            var action = new RequestApproverAction
            {
                RequestId = requestId,
                Name = employee.FIRST_NAME,
                Surname = employee.SURNAME,
                PostId = employee.POST_NO,
                ActionerServiceNumber = employee.SERVICE_NO,
                ActionDate = DateTime.UtcNow,
                ApproverRole = role.GetDescription(),
                ActionType = actionType.GetDescription(),
            };

            _db.RequestApproverActions.Add(action);
            return action;
        }
    }
}
