using EUAMS.Shared.DTOs.RequestApproverAction;

namespace EUAMS.Shared.Interfaces
{
    public interface IRequestApproverActionService
    {
        Task<List<RequestApproverActionDetails>> GetApproverActionForRequestAsync(int requestId);
    }
}