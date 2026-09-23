namespace EUAMS.Data.Entities.CesarDb
{
    public class EmailAttachmentQueue
    {
        public int EmailAttachmentQueueId { get; set; }

        public int EmailQueueId { get; set; }

        public int ApplicationId { get; set; }

        public string Filename { get; set; }

        public string ContentType { get; set; }

        public byte[] Attachment { get; set; }
    }
}
