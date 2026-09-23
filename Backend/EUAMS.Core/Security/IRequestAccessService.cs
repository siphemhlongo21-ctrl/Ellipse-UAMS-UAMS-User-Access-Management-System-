using EUAMS.Data.Entities;

namespace EUAMS.Core.Security
{
    public interface IRequestAccessService
    {
        Task EnsureLoadedAsync(CancellationToken cancellationToken = default);

        bool CanEditRequestContent(Request request);

        bool CanUploadDocuments(Request request);

        bool IsRequestClosed(Request request);

        IQueryable<Request> FilterViewable(IQueryable<Request> query);

        void EnsureCanEdit(Request request);

        void EnsureCanUpload(Request request);

        void EnsureNotClosed(Request request);
    }
}
