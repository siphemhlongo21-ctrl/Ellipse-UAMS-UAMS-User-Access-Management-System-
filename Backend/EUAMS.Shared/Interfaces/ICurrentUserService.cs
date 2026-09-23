namespace EUAMS.Shared.Interfaces
{
    public interface ICurrentUserService
    {
        bool IsAuthenticated { get; }

        string ServiceNumber { get; }

        IReadOnlyCollection<string> Permissions { get; }

        IReadOnlyCollection<string> Roles { get; }

        string Email { get; }

        string DisplayName { get; }

        string FirstName { get; }

        string Surname { get; }

        string PostId { get; }

        bool HasPermission(string permissionCode);

        bool HasAnyPermission(params string[] permissionCodes);

        Task EnsureLoadedAsync(CancellationToken cancellationToken = default);
    }
}
