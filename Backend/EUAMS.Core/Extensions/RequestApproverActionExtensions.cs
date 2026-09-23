using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.RequestApproverAction;

namespace EUAMS.Core.Extensions
{
    public static class RequestApprovalExtensions
    {
        public static RequestApproverActionDetails ToDetails(this RequestApproverAction requestApproverAction)
        {
            return new RequestApproverActionDetails
            {
                Id = requestApproverAction.Id,
                Name = requestApproverAction.Name,
                Surname = requestApproverAction.Surname,
                PostId = requestApproverAction.PostId,
                ServiceNumber = requestApproverAction.ActionerServiceNumber,
                ApproverDate = requestApproverAction.ActionDate,
                RequestId = requestApproverAction.RequestId,
                ApproverType = requestApproverAction.ApproverRole,
                ActionType = requestApproverAction.ActionType,
            };
        }

        public static List<RequestApproverActionDetails> ToListDetails(this List<RequestApproverAction> requestApproverActions)
        {
            return requestApproverActions.Select(requestApproverAction => requestApproverAction.ToDetails()).ToList();
        }
    }
}
