using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace EUAMS.Core.Storage
{
    public class MinioObjectStorage : IObjectStorage
    {
        private readonly IMinioClient _client;
        private readonly StorageOptions _options;
        private readonly ILogger<MinioObjectStorage> _logger;
        private readonly SemaphoreSlim _bucketLock = new(1, 1);
        private bool _bucketEnsured;

        public MinioObjectStorage(IOptions<StorageOptions> options, ILogger<MinioObjectStorage> logger)
        {
            _options = options.Value;
            _logger = logger;

            if (string.IsNullOrWhiteSpace(_options.Endpoint))
            {
                throw new InvalidOperationException("Storage:Endpoint is required.");
            }

            _client = new MinioClient()
                .WithEndpoint(_options.Endpoint)
                .WithCredentials(_options.AccessKey, _options.SecretKey)
                .WithSSL(_options.UseSsl)
                .Build();
        }

        public async Task PutAsync(
            string key,
            Stream content,
            string contentType,
            long contentLength,
            CancellationToken cancellationToken = default)
        {
            await EnsureBucketAsync(cancellationToken);

            var args = new PutObjectArgs()
                .WithBucket(_options.Bucket)
                .WithObject(key)
                .WithStreamData(content)
                .WithObjectSize(contentLength)
                .WithContentType(string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);

            await _client.PutObjectAsync(args, cancellationToken);
            _logger.LogInformation("Stored object {Key} in bucket {Bucket}", key, _options.Bucket);
        }

        public async Task<Stream> GetAsync(string key, CancellationToken cancellationToken = default)
        {
            var ms = new MemoryStream();
            var args = new GetObjectArgs()
                .WithBucket(_options.Bucket)
                .WithObject(key)
                .WithCallbackStream(stream => stream.CopyTo(ms));

            await _client.GetObjectAsync(args, cancellationToken);
            ms.Position = 0;
            return ms;
        }

        public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return;
            }

            try
            {
                var args = new RemoveObjectArgs()
                    .WithBucket(_options.Bucket)
                    .WithObject(key);
                await _client.RemoveObjectAsync(args, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete object {Key} from bucket {Bucket}", key, _options.Bucket);
            }
        }

        private async Task EnsureBucketAsync(CancellationToken cancellationToken)
        {
            if (_bucketEnsured || !_options.CreateBucketIfNotExists)
            {
                return;
            }

            await _bucketLock.WaitAsync(cancellationToken);
            try
            {
                if (_bucketEnsured)
                {
                    return;
                }

                var exists = await _client.BucketExistsAsync(
                    new BucketExistsArgs().WithBucket(_options.Bucket),
                    cancellationToken);

                if (!exists)
                {
                    await _client.MakeBucketAsync(
                        new MakeBucketArgs().WithBucket(_options.Bucket),
                        cancellationToken);
                    _logger.LogInformation("Created MinIO bucket {Bucket}", _options.Bucket);
                }

                _bucketEnsured = true;
            }
            finally
            {
                _bucketLock.Release();
            }
        }
    }
}
