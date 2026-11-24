using EUAMS.Shared.DTOs.Permission;

namespace EUAMS.Shared.Interfaces
{
    public interface IPermissionService
    {
        Task<List<string>> GetPermissionsForUserAsync(string serviceNumber, CancellationToken cancellationToken = default);

        Task<List<string>> GetRolesForUserAsync(string serviceNumber, CancellationToken cancellationToken = default);

        Task<List<PermissionDetails>> GetPermissionsAsync(string? permissionName = null, CancellationToken cancellationToken = default);

        Task<PermissionDetails?> GetPermissionAsync(int permissionId, CancellationToken cancellationToken = default);

        Task<PermissionDetails> CreatePermissionAsync(PermissionDetails permissionDetails, CancellationToken cancellationToken = default);

        Task<PermissionDetails?> UpdatePermissionAsync(PermissionDetails permissionDetails, CancellationToken cancellationToken = default);

        Task<bool> DeletePermissionAsync(int permissionId, CancellationToken cancellationToken = default);

        Task<List<string>> GetPermissionsForRole(string Role, CancellationToken cancellationToken = default);
    }
}




