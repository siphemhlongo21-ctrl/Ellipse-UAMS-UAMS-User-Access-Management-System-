using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EUAMS.Core.Storage
{
    /// <summary>Stores documents on the local filesystem under <see cref="StorageOptions.RootPath"/>.</summary>
    public class LocalFileObjectStorage : IObjectStorage
    {
        private readonly string _rootPath;
        private readonly ILogger<LocalFileObjectStorage> _logger;

        public LocalFileObjectStorage(IOptions<StorageOptions> options, ILogger<LocalFileObjectStorage> logger)
        {
            _logger = logger;
            var configured = options.Value.RootPath?.Trim();
            if (string.IsNullOrWhiteSpace(configured))
            {
                throw new InvalidOperationException("Storage:RootPath is required when Provider is Local.");
            }

            _rootPath = Path.GetFullPath(configured);
            Directory.CreateDirectory(_rootPath);
            _logger.LogInformation("Local document storage root: {RootPath}", _rootPath);
        }

        public async Task PutAsync(
            string key,
            Stream content,
            string contentType,
            long contentLength,
            CancellationToken cancellationToken = default)
        {
            var path = ResolvePath(key);
            var directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await using var file = new FileStream(
                path,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);
            await content.CopyToAsync(file, cancellationToken);
            _logger.LogInformation("Stored document {Key} at {Path}", key, path);
        }

        public Task<Stream> GetAsync(string key, CancellationToken cancellationToken = default)
        {
            var path = ResolvePath(key);
            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"Document object '{key}' was not found.", path);
            }

            Stream stream = new FileStream(
                path,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 81920,
                useAsync: true);
            return Task.FromResult(stream);
        }

        public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return Task.CompletedTask;
            }

            try
            {
                var path = ResolvePath(key);
                if (File.Exists(path))
                {
                    File.Delete(path);
                    _logger.LogInformation("Deleted document {Key} at {Path}", key, path);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete document object {Key}", key);
            }

            return Task.CompletedTask;
        }

        private string ResolvePath(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException("Storage key is required.", nameof(key));
            }

            var relative = key.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relative));

            // Prevent path traversal outside the configured root.
            var rootWithSep = _rootPath.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            if (!fullPath.StartsWith(rootWithSep, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fullPath, _rootPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Invalid storage key path.");
            }

            return fullPath;
        }
    }
}
