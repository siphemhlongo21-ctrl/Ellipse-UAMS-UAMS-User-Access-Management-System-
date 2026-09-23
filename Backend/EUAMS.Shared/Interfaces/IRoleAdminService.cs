using EUAMS.Shared.DTOs.Security;

namespace EUAMS.Shared.Interfaces
{
    public interface IRoleAdminService
    {
        Task<List<RoleDetails>> GetRolesAsync(string? filterstring = null, bool includeInactive = false, CancellationToken cancellationToken = default);

        Task<RoleDetails?> GetRoleAsync(int roleId, CancellationToken cancellationToken = default);

        Task<RoleDetails> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);

        Task<RoleDetails> UpdateRoleAsync(int roleId, UpdateRoleRequest request, CancellationToken cancellationToken = default);

        Task<RoleDetails> SetRolePermissionsAsync(int roleId, SetRolePermissionsRequest request, CancellationToken cancellationToken = default);

        Task<bool> DeactivateRoleAsync(int roleId, CancellationToken cancellationToken = default);

        Task<bool> DeleteRoleAsync(int roleId, CancellationToken cancellationToken = default);

        Task<List<AppUserSummary>> GetUsersAsync(CancellationToken cancellationToken = default);

        Task<AppUserSummary?> GetUserAsync(int appUserId, CancellationToken cancellationToken = default);

        Task<List<UserRoleDetails>> GetUserRolesAsync(int appUserId, CancellationToken cancellationToken = default);

        Task<UserRoleDetails> AssignRoleAsync(AssignRoleRequest request, CancellationToken cancellationToken = default);

        Task<bool> RevokeRoleAsync(string serviceNumber, string roleCode, CancellationToken cancellationToken = default);

        Task<bool> SetUserActiveAsync(int appUserId, bool isActive, CancellationToken cancellationToken = default);
    }
}