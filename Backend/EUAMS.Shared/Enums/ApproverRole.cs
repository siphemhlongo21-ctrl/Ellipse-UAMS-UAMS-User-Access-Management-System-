namespace EUAMS.Shared.Enums
{
    public enum ApproverRole
    {
        LineManager = 1,
        TrainingCentre = 2,
        ICTManager = 3,
        HCSystemsOfficer = 4,
        /// <summary>Retired — Deputy Head removed by functional review.</summary>
        [Obsolete("Deputy Head removed from workflow.")]
        DeputyHead = 5

    }
}
