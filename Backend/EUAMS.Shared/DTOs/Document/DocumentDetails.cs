namespace EUAMS.Shared.DTOs.Document
{
    public class DocumentDetails
    {
        public int Id { get; set; }

        /// <summary>Obsolete for new clients — use Upload/Download. Accepted on Create for compatibility.</summary>
        public byte[]? Data { get; set; }

        public string? StorageKey { get; set; }

        public string? FileName { get; set; }

        public string? ContentType { get; set; }

        public long? ContentLength { get; set; }

        public DateTime DateUploaded { get; set; }

        public DateTime? DateModified { get; set; }

        public string DocumentType { get; set; } = string.Empty;

        public string? DocumentCategory { get; set; }

        public int RequestId { get; set; }

        public bool Active { get; set; }

        public bool Archived { get; set; }

        public DateTime? ArchivedDate { get; set; }
    }

    public class DocumentDownloadResult
    {
        public byte[] Content { get; set; } = Array.Empty<byte>();

        public string ContentType { get; set; } = "application/octet-stream";

        public string FileName { get; set; } = "document";
    }
}
