using EUAMS.API.Security;
using EUAMS.Shared.DTOs.Reports;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reports;

        public ReportsController(IReportService reports)
        {
            _reports = reports;
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.ReportPhase1, PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<Phase1DashboardReport>> Phase1Dashboard()
        {
            return Ok(await _reports.GetPhase1DashboardAsync());
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.ReportPhase1, PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<List<AccessRequestReportRow>>> AccessRequests(
            DateTime? fromUtc = null,
            DateTime? toUtc = null,
            string? environment = null,
            string? requestType = null,
            string? status = null)
        {
            return Ok(await _reports.GetAccessRequestReportAsync(fromUtc, toUtc, environment, requestType, status));
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.ReportPhase1, PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<List<AccessRequestReportRow>>> AccessAmendments(
            DateTime? fromUtc = null,
            DateTime? toUtc = null)
        {
            return Ok(await _reports.GetAccessAmendmentReportAsync(fromUtc, toUtc));
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.ReportPhase1, PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<List<AccessRequestReportRow>>> EnvironmentAccess(
            string? environment = null,
            bool? activeOnly = null)
        {
            return Ok(await _reports.GetEnvironmentAccessReportAsync(environment, activeOnly));
        }

        [HttpGet]
        [AuthorizePermission(PermissionCodes.ReportPhase1, PermissionCodes.RequestApproveIct)]
        public async Task<ActionResult<List<ContractorAccessReportRow>>> ContractorAccess(
            string? companyName = null,
            DateTime? contractEndFrom = null,
            DateTime? contractEndTo = null,
            string? accessState = null)
        {
            return Ok(await _reports.GetContractorAccessReportAsync(
                companyName, contractEndFrom, contractEndTo, accessState));
        }
    }
}
