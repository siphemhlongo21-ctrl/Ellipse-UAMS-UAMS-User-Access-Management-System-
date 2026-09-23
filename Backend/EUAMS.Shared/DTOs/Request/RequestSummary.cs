namespace EUAMS.Shared.DTOs.Request
{
    public class RequestSummary
    {
        public int Id { get; set; }

        public string Status { get; set; } = string.Empty;

        public string RequestType { get; set; } = string.Empty;

        public string Environment { get; set; } = string.Empty;

        public string UserAccessType { get; set; } = string.Empty;

        public string AdditionalUserAccess { get; set; } = string.Empty;
    }
}

