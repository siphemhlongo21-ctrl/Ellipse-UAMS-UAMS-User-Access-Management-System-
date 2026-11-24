using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Shared.DTOs.Permission;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Security
{
    public class PermissionService : IPermissionService
    {
        private readonly EuamsDbContext _db;
        public PermissionService(EuamsDbContext db)
        {
            _db = db;
        }

        public async Task<List<string>> GetPermissionsForRole(
            string roleName,
            CancellationToken cancellationToken = default)
        {
            var role = await _db.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    o => o.Name.ToLower() == roleName.ToLower() || o.Code.ToLower() == roleName.ToLower(),
                    cancellationToken);

            if (role == null) return new List<string>();

            return await _db.RolePermissions
                .AsNoTracking()
                .Where(rp => rp.RoleId == role.Id)
                .Include(rp => rp.Permission)
                .Where(o => o.Permission.Active)
                .Select(rp => rp.Permission.Code)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        public async Task<List<string>> GetPermissionsForUserAsync(
      string serviceNumber,
      CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var appUser = await
                FindAppUserAsync(serviceNumber, cancellationToken);

            return await _db.UserRoles
                .AsNoTracking()
                .Where(ur => ur.ServiceNumber == serviceNumber)
                .Where(ur => ur.EffectiveFrom == null || ur.EffectiveFrom <= now)
                .Where(ur => ur.EffectiveTo == null || ur.EffectiveTo >= now)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Include(o => o.Permission)
                .Where(o => o.Permission.Active)
                .Select(rp => rp.Permission.Code)
                .Distinct()
                .ToListAsync(cancellationToken);
        }
        public async Task<List<string>> GetRolesForUserAsync(string serviceNumber, CancellationToken cancellationToken = default)

        {
            var now = DateTime.UtcNow;

            return await _db.UserRoles
                   .AsNoTracking()
                   .Where(ur => ur.ServiceNumber == serviceNumber)
                   .Where(ur => ur.EffectiveFrom == null || ur.EffectiveFrom <= now)
                   .Where(ur => ur.EffectiveTo == null || ur.EffectiveTo >= now)
                   .Select(ur => ur.Role.Code)
                   .Distinct()
                   .ToListAsync(cancellationToken);
        }
        public async Task<List<PermissionDetails>> GetPermissionsAsync(string? permissionName = null, CancellationToken cancellationToken = default)
        {
            permissionName = permissionName?.Trim();

            var permissionList = await _db.Permissions
                .AsNoTracking()
                .Where(p =>
                    (string.IsNullOrWhiteSpace(permissionName) ||
                     p.Code.Contains(permissionName) ||
                     p.Name.Contains(permissionName)))
                .OrderByDescending(p => p.Active)
                .ThenBy(p => p.Name)
                .ToListAsync(cancellationToken);

            return permissionList
                .Select(p => p.ToDetails())
                .ToList();
        }
        public async Task<PermissionDetails?> GetPermissionAsync(int permissionId, CancellationToken cancellationToken = default)
        {
            var permission = await _db.Permissions
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.Id == permissionId && p.Active,
                    cancellationToken);

            return permission?.ToDetails();
        }
        public async Task<PermissionDetails> CreatePermissionAsync(PermissionDetails permissionDetails, CancellationToken cancellationToken = default)
        {
            var permission = permissionDetails.ToEntity();
            permission.Id = await _db.Permissions
                .Select(p => (int?)p.Id)
                .MaxAsync(cancellationToken) is int maxId ? maxId + 1 : 1;
            permission.Active = true;

            _db.Permissions.Add(permission);

            await _db.SaveChangesAsync(cancellationToken);

            return permission.ToDetails();
        }
        public async Task<PermissionDetails?> UpdatePermissionAsync(PermissionDetails permissionDetails, CancellationToken cancellationToken = default)
        {
            var permission = await _db.Permissions.FindAsync(new object[] { permissionDetails.Id }, cancellationToken);
            if (permission == null)
            {
                return null;
            }

            permission.Code = permissionDetails.Code;
            permission.Name = permissionDetails.Name;
            permission.Description = permissionDetails.Description;
            permission.Active = permissionDetails.Active;

            await _db.SaveChangesAsync(cancellationToken);

            return permission.ToDetails();
        }

        public async Task<bool> DeletePermissionAsync(int permissionId, CancellationToken cancellationToken = default)
        {
            var permission = await _db.Permissions
                .Include(p => p.RolePermissions)
                .FirstOrDefaultAsync(
                    p => p.Id == permissionId && p.Active,
                    cancellationToken);

            if (permission == null || permission.RolePermissions.Any())
            {
                return false;
            }
            permission.Active = false;

            await _db.SaveChangesAsync(cancellationToken);

            return true;
        }

        private async Task<EUAMS.Data.Entities.AppUser?> FindAppUserAsync(
            string key,
            CancellationToken cancellationToken)
        {
            var value = (key ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var appUser = await _db.AppUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.ServiceNumber == value,
                    cancellationToken);

            if (appUser is not null)
            {
                return appUser;
            }

            var employee = await _db.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    e => e.ServiceNumber == value || e.EmailAddress == value,
                    cancellationToken);

            if (employee is null)
            {
                return null;
            }

            return await _db.AppUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    u => u.Email == employee.EmailAddress || u.EmployeeEmail == employee.EmailAddress,
                    cancellationToken);
        }
    }
}
