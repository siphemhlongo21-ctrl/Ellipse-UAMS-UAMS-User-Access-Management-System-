namespace EUAMS.Shared.DTOs.Request
{
    public class ReturnForAmendmentDetails
    {
        /// <summary>e.g. MissingDocuments, IncorrectDetails</summary>
        public string AmendmentType { get; set; } = string.Empty;

        public string Reason { get; set; } = string.Empty;

        /// <summary>Comma-separated or free-text list of documents / fields required.</summary>
        public string DocumentsRequested { get; set; } = string.Empty;
    }
}
