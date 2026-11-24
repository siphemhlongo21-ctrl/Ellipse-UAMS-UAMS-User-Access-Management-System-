using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Reports;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Reports
{
    public class ReportService : IReportService
    {
        private static readonly HashSet<string> OpenStatuses =
        [
            RequestStatus.Draft.GetDescription(),
            RequestStatus.PendingApproval.GetDescription(),
            RequestStatus.TrainingVerificationPending.GetDescription(),
            RequestStatus.ICTManagerApprovalPending.GetDescription(),
            RequestStatus.HcActionPending.GetDescription(),
            RequestStatus.ReturnForAmendment.GetDescription()
        ];

        private readonly EuamsDbContext _db;

        public ReportService(EuamsDbContext db)
        {
            _db = db;
        }

        public async Task<Phase1DashboardReport> GetPhase1DashboardAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var since = now.AddDays(-30);

            var byStatus = await _db.Requests.AsNoTracking()
                .GroupBy(r => r.Status)
                .Select(g => new StatusCountRow { Status = g.Key.ToString(), Count = g.Count() })
                .OrderBy(x => x.Status)
                .ToListAsync(cancellationToken);

            var byEnvironment = await _db.Requests.AsNoTracking()
                .GroupBy(r => (r.Environment ?? "Unknown"))
                .Select(g => new EnvironmentCountRow { Environment = g.Key, Count = g.Count() })
                .OrderBy(x => x.Environment)
                .ToListAsync(cancellationToken);

            var openCount = await _db.Requests.AsNoTracking()
                .CountAsync(r => OpenStatuses.Contains(r.Status), cancellationToken);

            var returnCount = await _db.Requests.AsNoTracking()
                .CountAsync(r => r.Status == RequestStatus.ReturnForAmendment.GetDescription(), cancellationToken);

            var implemented30 = await _db.Requests.AsNoTracking()
                .CountAsync(r => r.Status == RequestStatus.Implemented.GetDescription() && r.DateAccessGranted >= since, cancellationToken);

            var rejected30 = await _db.Requests.AsNoTracking()
                .CountAsync(r => r.Status == RequestStatus.Rejected.GetDescription() && r.RequestedDate >= since, cancellationToken);

            var oldest = await _db.Requests.AsNoTracking()
                .Where(r => OpenStatuses.Contains(r.Status))
                .OrderBy(r => r.RequestedDate)
                .Take(20)
                .Select(r => new AgingRequestRow
                {
                    RequestId = r.Id,
                    RequestNumber = r.RequestNumber,
                    Status = r.Status.ToString(),
                    Environment = r.Environment,
                    RequestedDate = r.RequestedDate,
                    AgeDays = (int)EF.Functions.DateDiffDay(r.RequestedDate, now)
                })
                .ToListAsync(cancellationToken);

            return new Phase1DashboardReport
            {
                GeneratedAtUtc = now,
                ByStatus = byStatus,
                ByEnvironment = byEnvironment,
                OpenRequests = openCount,
                ReturnForAmendmentCount = returnCount,
                ImplementedLast30Days = implemented30,
                RejectedLast30Days = rejected30,
                OldestOpenRequests = oldest
            };
        }

        public async Task<List<AccessRequestReportRow>> GetAccessRequestReportAsync(
            DateTime? fromUtc = null,
            DateTime? toUtc = null,
            string? environment = null,
            string? requestType = null,
            string? status = null,
            CancellationToken cancellationToken = default)
        {
            var query = BaseRequestQuery();

            if (fromUtc is not null)
            {
                query = query.Where(r => r.RequestedDate >= fromUtc);
            }

            if (toUtc is not null)
            {
                query = query.Where(r => r.RequestedDate <= toUtc);
            }

            if (!string.IsNullOrWhiteSpace(environment))
            {
                var env = environment.Trim();
                query = query.Where(r => r.Environment == env);
            }

            if (!string.IsNullOrWhiteSpace(requestType))
            {
                var rt = requestType.Trim();
                query = query.Where(r => r.RequestType == rt);
            }

            if (!string.IsNullOrWhiteSpace(status)
                && Enum.TryParse<RequestStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == status);
            }

            var entities = await query.OrderByDescending(r => r.RequestedDate).ToListAsync(cancellationToken);
            return entities.Select(MapAccessRow).ToList();
        }

        public async Task<List<AccessRequestReportRow>> GetAccessAmendmentReportAsync(
            DateTime? fromUtc = null,
            DateTime? toUtc = null,
            CancellationToken cancellationToken = default)
        {
            var query = BaseRequestQuery().Where(r =>
                r.RequestType.Contains("Amend")
                || r.RequestType.Contains("Removal")
                || r.RequestType.Contains("Terminate")
                || r.RequestType == "AMENDMENT"
                || r.RequestType == "REMOVAL"
                || r.RequestType == "TERMINATION");

            if (fromUtc is not null)
            {
                query = query.Where(r => r.RequestedDate >= fromUtc);
            }

            if (toUtc is not null)
            {
                query = query.Where(r => r.RequestedDate <= toUtc);
            }

            var entities = await query.OrderByDescending(r => r.RequestedDate).ToListAsync(cancellationToken);
            return entities.Select(MapAccessRow).ToList();
        }

        public async Task<List<AccessRequestReportRow>> GetEnvironmentAccessReportAsync(
            string? environment = null,
            bool? activeOnly = null,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var query = BaseRequestQuery();

            if (!string.IsNullOrWhiteSpace(environment))
            {
                var env = environment.Trim();
                query = query.Where(r => r.Environment == env);
            }

            if (activeOnly == true)
            {
                query = query.Where(r => r.EndDate == null || r.EndDate >= now);
            }
            else if (activeOnly == false)
            {
                query = query.Where(r => r.EndDate != null && r.EndDate < now);
            }

            var entities = await query.OrderByDescending(r => r.DateAccessGranted).ToListAsync(cancellationToken);
            return entities.Select(MapAccessRow).ToList();
        }

        public async Task<List<ContractorAccessReportRow>> GetContractorAccessReportAsync(
            string? companyName = null,
            DateTime? contractEndFrom = null,
            DateTime? contractEndTo = null,
            string? accessState = null,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var query = _db.Requests.AsNoTracking()
                .Include(r => r.Contractor)
                .Where(r => r.ContractId != null && r.Contractor != null);

            if (!string.IsNullOrWhiteSpace(companyName))
            {
                query = query.Where(r => r.Contractor!.CompanyName.ToLower().Contains(companyName.ToLower()));
            }

            if (contractEndFrom is not null)
            {
                query = query.Where(r => r.Contractor!.EndDate >= contractEndFrom);
            }

            if (contractEndTo is not null)
            {
                query = query.Where(r => r.Contractor!.EndDate <= contractEndTo);
            }

            var entities = await query.OrderBy(r => r.Contractor!.EndDate).ToListAsync(cancellationToken);
            var rows = entities.Select(r =>
            {
                var end = r.Contractor!.EndDate;
                var state = r.Status != RequestStatus.Implemented.GetDescription()
                    ? "NotActive"
                    : end < now ? "Expired"
                    : end <= now.AddDays(30) ? "Expiring"
                    : "Active";

                return new ContractorAccessReportRow
                {
                    RequestId = r.Id,
                    RequestNumber = r.RequestNumber,
                    ContractId = r.ContractId!.Value,
                    CompanyName = r.Contractor.CompanyName,
                    ContractorName = $"{r.Contractor.FirstName} {r.Contractor.Surname}",
                    Environment = r.Environment,
                    Status = r.Status.ToString(),
                    ContractStartDate = r.Contractor.StartDate,
                    ContractEndDate = end,
                    AccessState = state
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(accessState))
            {
                var state = accessState.Trim();
                rows = rows.Where(r => r.AccessState.Equals(state, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return rows;
        }

        private IQueryable<Request> BaseRequestQuery() =>
            _db.Requests.AsNoTracking()
                .Include(r => r.Employee).Include(r => r.Contractor);

        private static AccessRequestReportRow MapAccessRow(Request r) => new()
        {
            RequestId = r.Id,
            RequestNumber = r.RequestNumber,
            RequestType = r.RequestType,
            Environment = r.Environment,
            Status = r.Status.ToString(),
            Department = r.Employee?.Department,
            EmployeeEmail = r.EmployeeEmail,
            ContractId = r.ContractId,
            RequestedDate = r.RequestedDate.ToLocalTime(),
            StartDate = r.StartDate.ToLocalTime(),
            EndDate = r.EndDate
        };
    }
}
