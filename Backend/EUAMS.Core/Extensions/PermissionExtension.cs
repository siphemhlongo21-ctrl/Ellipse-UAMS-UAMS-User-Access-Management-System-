using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Permission;

namespace EUAMS.Core.Extensions
{
    public static class PermissionExtension
    {
        public static PermissionDetails ToDetails(this Permission permission)
        {
            return new PermissionDetails
            {
                Id = permission.Id,
                Code = permission.Code,
                Name = permission.Name,
                Description = permission.Description,
                Active = permission.Active,
            };
        }

        public static Permission ToEntity(this PermissionDetails permissionDetails)
        {
            return new Permission
            {
                Id = permissionDetails.Id,
                Code = permissionDetails.Code,
                Name = permissionDetails.Name,
                Description = permissionDetails.Description,
                Active = permissionDetails.Active,
            };
        }
    }
}