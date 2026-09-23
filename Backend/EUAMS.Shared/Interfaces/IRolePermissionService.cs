using EUAMS.Shared.DTOs.RolePermission;

namespace EUAMS.Shared.Interfaces
{
    public interface IRolePermissionService
    {
        Task<IEnumerable<RolePermissionDetails>> GetRolePermissions(string filterString);

        Task<RolePermissionDetails?> GetRolePermission(int roleId, int permissionId);

        Task<RolePermissionDetails> AddRolePermission(AddRolePermissionDetails details);

        Task<bool> DeleteRolePermission(int roleId, int permissionId);
    }
}