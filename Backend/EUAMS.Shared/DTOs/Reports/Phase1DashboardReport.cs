namespace EUAMS.Shared.DTOs.Reports
{
    public class Phase1DashboardReport
    {
        public DateTime GeneratedAtUtc { get; set; }

        public List<StatusCountRow> ByStatus { get; set; } = new();

        public List<EnvironmentCountRow> ByEnvironment { get; set; } = new();

        public int OpenRequests { get; set; }

        public int ReturnForAmendmentCount { get; set; }

        public int ImplementedLast30Days { get; set; }

        public int RejectedLast30Days { get; set; }

        public List<AgingRequestRow> OldestOpenRequests { get; set; } = new();
    }

    public class StatusCountRow
    {
        public string Status { get; set; } = string.Empty;

        public int Count { get; set; }
    }

    public class EnvironmentCountRow
    {
        public string Environment { get; set; } = string.Empty;

        public int Count { get; set; }
    }

    public class AgingRequestRow
    {
        public int RequestId { get; set; }

        public string? RequestNumber { get; set; }

        public string Status { get; set; } = string.Empty;

        public string? Environment { get; set; }

        public DateTime RequestedDate { get; set; }

        public int AgeDays { get; set; }
    }

    /// <summary>PDF §5 — Access Request Report row.</summary>
    public class AccessRequestReportRow
    {
        public int RequestId { get; set; }
        public string? RequestNumber { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string? Environment { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? EmployeeEmail { get; set; }
        public int? ContractId { get; set; }
        public DateTime RequestedDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class ContractorAccessReportRow
    {
        public int RequestId { get; set; }
        public string? RequestNumber { get; set; }
        public int ContractId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string ContractorName { get; set; } = string.Empty;
        public string? Environment { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ContractStartDate { get; set; }
        public DateTime ContractEndDate { get; set; }
        public string AccessState { get; set; } = string.Empty;
    }
}
