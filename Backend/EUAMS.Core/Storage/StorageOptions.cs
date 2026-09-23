namespace EUAMS.Core.Storage
{
    public class StorageOptions
    {
        public const string SectionName = "Storage";

        /// <summary>Minio | Local</summary>
        public string Provider { get; set; } = "Minio";

        /// <summary>Host:port without scheme, e.g. localhost:9000 (Minio).</summary>
        public string Endpoint { get; set; } = "localhost:9000";

        public string AccessKey { get; set; } = string.Empty;

        public string SecretKey { get; set; } = string.Empty;

        public string Bucket { get; set; } = "ellipse-documents";

        public bool UseSsl { get; set; }

        public bool CreateBucketIfNotExists { get; set; } = true;

        /// <summary>Root folder for Provider=Local (IIS: E:\ellipse-documents\docs).</summary>
        public string RootPath { get; set; } = @"E:\ellipse-documents\docs";
    }
}
