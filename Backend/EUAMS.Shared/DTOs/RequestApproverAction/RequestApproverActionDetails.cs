namespace EUAMS.Shared.DTOs.RequestApproverAction
{
    public class RequestApproverActionDetails
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Surname { get; set; }

        public string PostId { get; set; }

        public string ServiceNumber { get; set; }

        public DateTime ApproverDate { get; set; }

        public int RequestId { get; set; }

        public string ApproverType { get; set; }

        public string ActionType { get; set; }

        public string? RejectionReason { get; set; }
    }
}