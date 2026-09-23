using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.RolePermission;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Services
{
    public class RolePermissionServices : IRolePermissionService
    {
        private readonly EuamsDbContext _context;

        public RolePermissionServices(EuamsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RolePermissionDetails>> GetRolePermissions(string filterString)
        {
            var query = _context.RolePermissions
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrEmpty(filterString))
            {
                query = query.Where(x =>
                    x.Role.Name.Contains(filterString) ||
                    x.Permission.Name.Contains(filterString));
            }

            return await query
                .Select(x => new RolePermissionDetails
                {
                    RoleId = x.RoleId,
                    PermissionId = x.PermissionId,
                    RoleName = x.Role.Name,
                    PermissionName = x.Permission.Name
                })
                .ToListAsync();
        }

        public async Task<RolePermissionDetails?> GetRolePermission(int roleId, int permissionId)
        {
            return await _context.RolePermissions
                .Where(x =>
                    x.RoleId == roleId &&
                    x.PermissionId == permissionId &&
                    !x.IsDeleted)
                .Select(x => new RolePermissionDetails
                {
                    RoleId = x.RoleId,
                    PermissionId = x.PermissionId,
                    RoleName = x.Role.Name,
                    PermissionName = x.Permission.Name
                })
                .FirstOrDefaultAsync();
        }


        public async Task<RolePermissionDetails> AddRolePermission(AddRolePermissionDetails details)
        {
            // Validate permission exists
            bool permissionExists = await _context.Permissions
                .AnyAsync(p => p.Id == details.PermissionId);

            if (!permissionExists)
                throw new KeyNotFoundException($"Permission {details.PermissionId} not found.");
            var entity = await _context.RolePermissions.FirstOrDefaultAsync(o => o.RoleId == details.RoleId && o.PermissionId == details.PermissionId);

            if(entity != null) 
            {
                entity.IsDeleted = false;
            }
            else
            {
                entity = new RolePermission
                {
                    RoleId = details.RoleId,
                    PermissionId = details.PermissionId,
                    CreatedDate = DateTime.UtcNow,
                    IsDeleted = false
                };

                _context.RolePermissions.Add(entity);
            }
            
            await _context.SaveChangesAsync();

            return await GetRolePermission(entity.RoleId, entity.PermissionId);
        }

        public async Task<bool> DeleteRolePermission(int roleId, int permissionId)
        {
            var entity = await _context.RolePermissions
                .FirstOrDefaultAsync(x =>
                    x.RoleId == roleId &&
                    x.PermissionId == permissionId);

            if (entity == null)
                return false;

            entity.IsDeleted = true;

            await _context.SaveChangesAsync();

            return true;
        }
    }
}