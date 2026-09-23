namespace EUAMS.Shared.Interfaces
{
    public interface IAppUserProvisioner
    {
        /// <summary>
        /// Finds or creates an AppUser for the AD username and returns the app user id.
        /// New users get EMPLOYEE; configured bootstrap admins also get SYSTEM_ADMIN.
        /// </summary>
        Task<int> GetOrCreateAppUserAsync(string serviceNumebr, CancellationToken cancellationToken = default);
    }
}
