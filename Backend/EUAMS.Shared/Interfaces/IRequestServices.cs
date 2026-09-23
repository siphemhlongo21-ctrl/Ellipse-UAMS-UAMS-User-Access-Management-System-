using EUAMS.Shared.DTOs.Request;

namespace EUAMS.Shared.Interfaces
{
    public interface IRequestServices
    {
        Task<RequestDetails> CreateRequest(NewRequestDetails requestDetails);

        Task<List<RequestDetails>> GetRequests();

        Task<RequestDetails?> GetRequest(int requestId);

        Task<List<RequestDetails>> SearchRequest(string searchString);

        Task<List<RequestDetails>> GetEmployeeRequestsByEmail(string email);

        Task<List<RequestDetails>> GetEmployeeRequestsByServiceNumber(string serviceNumber);

        Task<List<RequestDetails>> GetLineManagerRequestsByEmail(string email);

        Task<List<RequestDetails>> GetLineManagerRequestsByServiceNumber(string serviceNumber);

        Task<RequestDetails> UpdateRequest(RequestDetails requestDetails);

        Task<bool> LineManagerRequestApproval(int requestId);

        Task<bool> LineManagerRequestRejection(int requestId, string? rejectionReason = null);

        Task<bool> ICTManagerRequestApproval(int requestId);

        Task<bool> ICTManagerRequestRejection(int requestId, string? rejectionReason = null);

        Task<bool> TrainingCenterRequestVerification(int requestId, DateTime trainingDate, string? verifiedBy = null);

        Task<bool> TrainingCenterRequestUnverified(int requestId, string? rejectionReason = null);

        Task<bool> HcSystemsOfficerRequestImplementation(int requestId, ImplementRequestDetails details);

        Task<bool> HcSystemsOfficerRequestRejection(int requestId, string? rejectionReason = null);

        Task<bool> ReturnForAmendment(int requestId, ReturnForAmendmentDetails details);

        Task<bool> ResubmitAmendment(int requestId);

        Task<bool> CancelRequest(int requestId);

        Task<List<RequestDetails>> GetICTManagerRequestsAsync();

        Task<List<RequestDetails>> GetTrainingCenterRequestsAsync();

        Task<List<RequestDetails>> GetHcSystemsOfficerRequestsAsync();
    }
}
