using EUAMS.Shared.DTOs.Lookups;

namespace EUAMS.Shared.Interfaces
{
    /// <summary>Admin CRUD for Department/Branch/RequestType/EllipsePosition lookups (US-031).</summary>
    public interface ILookupsAdminService
    {
        Task<List<RequestTypeDetails>> GetRequestTypesAsync(CancellationToken cancellationToken = default);

        Task<RequestTypeDetails> CreateRequestTypeAsync(RequestTypeDetails details, CancellationToken cancellationToken = default);

        Task<RequestTypeDetails> UpdateRequestTypeAsync(RequestTypeDetails details, CancellationToken cancellationToken = default);
    }
}
