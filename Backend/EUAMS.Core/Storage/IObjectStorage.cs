namespace EUAMS.Core.Storage
{
    public interface IObjectStorage
    {
        Task PutAsync(
            string key,
            Stream content,
            string contentType,
            long contentLength,
            CancellationToken cancellationToken = default);

        Task<Stream> GetAsync(string key, CancellationToken cancellationToken = default);

        Task DeleteAsync(string key, CancellationToken cancellationToken = default);
    }
}
