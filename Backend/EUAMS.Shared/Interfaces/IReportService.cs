using EUAMS.Shared.DTOs.Reports;

namespace EUAMS.Shared.Interfaces
{
    public interface IReportService
    {
        Task<Phase1DashboardReport> GetPhase1DashboardAsync(CancellationToken cancellationToken = default);

        Task<List<AccessRequestReportRow>> GetAccessRequestReportAsync(
            DateTime? fromUtc = null,
            DateTime? toUtc = null,
            string? environment = null,
            string? requestType = null,
            string? status = null,
            CancellationToken cancellationToken = default);

        Task<List<AccessRequestReportRow>> GetAccessAmendmentReportAsync(DateTime? fromUtc = null, DateTime? toUtc = null, CancellationToken cancellationToken = default);

        Task<List<AccessRequestReportRow>> GetEnvironmentAccessReportAsync(string? environment = null, bool? activeOnly = null, CancellationToken cancellationToken = default);

        Task<List<ContractorAccessReportRow>> GetContractorAccessReportAsync(
            string? companyName = null,
            DateTime? contractEndFrom = null,
            DateTime? contractEndTo = null,
            string? accessState = null,
            CancellationToken cancellationToken = default);
    }
}
