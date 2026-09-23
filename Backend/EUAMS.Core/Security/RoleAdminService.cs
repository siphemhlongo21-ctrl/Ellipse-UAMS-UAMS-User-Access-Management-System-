using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Security;
using EUAMS.Shared.Interfaces;
using EUAMS.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Security
{
    public class RoleAdminService : IRoleAdminService
    {
        private readonly EuamsDbContext _db;
        private readonly DLRDbContext _dLRDbContext;
        private readonly ICurrentUserService _currentUser;

        public RoleAdminService(
            EuamsDbContext db,
            ICurrentUserService currentUser,
            DLRDbContext dLRDbContext)
        {
            _db = db;
            _currentUser = currentUser;
            _dLRDbContext = dLRDbContext;
        }

        public async Task<List<RoleDetails>> GetRolesAsync(string? filterString = null, bool includeInactive = false, CancellationToken cancellationToken = default)
        {
            var roles = await _db.Roles
                .AsNoTracking()
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .OrderBy(r => r.Id)
                .ToListAsync(cancellationToken);

            var assignedCounts = await GetAssignedUserCountsAsync(cancellationToken);

            return roles.Select(role => MapRole(role, assignedCounts.GetValueOrDefault(role.Id))).ToList();
        }

        public async Task<RoleDetails?> GetRoleAsync(
            int roleId,
            CancellationToken cancellationToken = default)
        {
            var role = await _db.Roles
                .AsNoTracking()
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

            if (role is null)
            {
                return null;
            }

            var assignedCounts = await GetAssignedUserCountsAsync(cancellationToken);

            return MapRole(role, assignedCounts.GetValueOrDefault(role.Id));
        }

        public async Task<RoleDetails> CreateRoleAsync(
            CreateRoleRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                throw new ArgumentException("Request is required.", nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                throw new ArgumentException("Role code is required.", nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ArgumentException("Role name is required.", nameof(request));
            }

            string code = request.Code.Trim().ToUpperInvariant();
            string name = request.Name.Trim();
            string? description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();

            if (code.Length > 50)
            {
                throw new ArgumentException("Role code cannot be longer than 50 characters.", nameof(request));
            }

            if (name.Length > 100)
            {
                throw new ArgumentException("Role name cannot be longer than 100 characters.", nameof(request));
            }

            if (description is not null && description.Length > 500)
            {
                throw new ArgumentException("Description cannot be longer than 500 characters.", nameof(request));
            }

            bool codeExists = await _db.Roles.AnyAsync(r => r.Code == code, cancellationToken);
            if (codeExists)
            {
                throw new InvalidOperationException($"A role with code '{code}' already exists.");
            }

            bool nameExists = await _db.Roles.AnyAsync(r => r.Name == name, cancellationToken);
            if (nameExists)
            {
                throw new InvalidOperationException($"A role named '{name}' already exists.");
            }

            // Roles.Id is ValueGeneratedNever (seeded 1–6), so the next id must be assigned here.
            int nextId = (await _db.Roles.MaxAsync(r => (int?)r.Id, cancellationToken) ?? 0) + 1;

            await _currentUser.EnsureLoadedAsync(cancellationToken);
            string? createdBy = !string.IsNullOrWhiteSpace(_currentUser.ServiceNumber)
                ? _currentUser.ServiceNumber
                : _currentUser.Email;

            var role = new Role
            {
                Id = nextId,
                Code = code,
                Name = name,
                Description = description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy
            };

            _db.Roles.Add(role);
            await _db.SaveChangesAsync(cancellationToken);

            return MapRole(role);
        }

        public async Task<RoleDetails> UpdateRoleAsync(
            int roleId,
            UpdateRoleRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                throw new ArgumentException("Request is required.", nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ArgumentException("Name is required.", nameof(request));
            }

            var role = await _db.Roles
                .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

            if (role is null)
            {
                throw new KeyNotFoundException($"Role {roleId} was not found.");
            }

            string name = request.Name.Trim();

            bool nameTaken = await _db.Roles.AnyAsync(
                r => r.Id != roleId && r.Name == name,
                cancellationToken);

            if (nameTaken)
            {
                throw new InvalidOperationException($"A role named '{name}' already exists.");
            }

            role.Name = name;
            role.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            role.ModifiedAt = DateTime.UtcNow;

            await _currentUser.EnsureLoadedAsync(cancellationToken);
            role.ModifiedBy = !string.IsNullOrWhiteSpace(_currentUser.ServiceNumber)
                ? _currentUser.ServiceNumber
                : _currentUser.Email;

            await _db.SaveChangesAsync(cancellationToken);

            _db.Entry(role).State = EntityState.Detached;
            return (await GetRoleAsync(roleId, cancellationToken))!;
        }

        public async Task<RoleDetails> SetRolePermissionsAsync(
            int roleId,
            SetRolePermissionsRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                throw new ArgumentException("Request is required.", nameof(request));
            }

            var role = await _db.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

            if (role is null)
            {
                throw new KeyNotFoundException($"Role {roleId} was not found.");
            }

            var requestedCodes = (request.Permissions ?? new List<string>())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (string.Equals(role.Code, RoleCodes.SystemAdmin, StringComparison.OrdinalIgnoreCase)
                && !requestedCodes.Contains(PermissionCodes.AdminRolesAssign, StringComparer.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("SYSTEM_ADMIN must retain the admin.roles.assign permission.");
            }

            var permissions = await ResolvePermissionsAsync(requestedCodes, cancellationToken);

            if (role.RolePermissions.Count > 0)
            {
                _db.RolePermissions.RemoveRange(role.RolePermissions);
            }

            role.RolePermissions.Clear();

            foreach (var permission in permissions)
            {
                role.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id
                });
            }

            await _db.SaveChangesAsync(cancellationToken);

            _db.Entry(role).State = EntityState.Detached;
            return (await GetRoleAsync(roleId, cancellationToken))!;
        }

        public async Task<bool> DeactivateRoleAsync(
            int roleId,
            CancellationToken cancellationToken = default)
        {
            var role = await _db.Roles
                .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

            if (role is null)
            {
                throw new KeyNotFoundException($"Role {roleId} was not found.");
            }

            if (string.Equals(role.Code, RoleCodes.SystemAdmin, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("The SYSTEM_ADMIN role cannot be deactivated.");
            }

            return true;
        }

        public async Task<bool> DeleteRoleAsync(
            int roleId,
            CancellationToken cancellationToken = default)
        {
            var role = await _db.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

            if (role is null)
            {
                throw new KeyNotFoundException($"Role with id '{roleId}' was not found.");
            }

            if (string.Equals(role.Code, RoleCodes.SystemAdmin, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("The SYSTEM_ADMIN role cannot be deleted.");
            }

            bool isAssigned = await HasActiveAssignmentAsync(roleId, cancellationToken);

            if (isAssigned)
            {
                throw new InvalidOperationException(
                    "This role cannot be deleted because it is assigned to one or more users.");
            }

            if (role.RolePermissions.Count > 0)
            {
                _db.RemoveRange(role.RolePermissions);
            }

            _db.Roles.Remove(role);
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<List<AppUserSummary>> GetUsersAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            var activeRoles = await ActiveUserRolesQuery(now)
                .AsNoTracking()
                .Include(ur => ur.Role)
                .ToListAsync(cancellationToken);

            var users = await _db.AppUsers
                .AsNoTracking()
                .Where(o => o.IsActive)
                .OrderBy(u => u.DisplayName)
                .ThenBy(u => u.Email)
                .ToListAsync(cancellationToken);


            var userSummaries = users.Where(o => activeRoles.Any(a => a.ServiceNumber == o.ServiceNumber)).Select(u => u.ToSummary(
                activeRoles
                    .Where(assignment => UserOwnsAssignment(u, assignment))
                    .Select(ur => ur.Role.Code)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(c => c)
                    .ToList())).ToList();

            var employees = await _dLRDbContext.DrlEmployeeDetails.ToListAsync();

            foreach (var employee in employees.Where(o => activeRoles.Any(a => a.ServiceNumber == o.SERVICE_NO)))
            {
                if (userSummaries.Any(u => u.ServiceNumber == employee.SERVICE_NO)) continue;

                userSummaries.Add(new AppUserSummary
                {
                    ActiveDirectoryUsername = employee.USERID,
                    Department = employee.DEPT_DESC,
                    DisplayName = employee.FIRST_NAME + " " + employee.SURNAME,
                    Email = employee.EMAIL,
                    IsActive = true,
                    ServiceNumber = employee.SERVICE_NO,
                    Roles = activeRoles.Where(x => x.ServiceNumber == employee.SERVICE_NO).Select(x => x.Role.Code).ToList(),
                });
            }

            var userRoles = new List<AppUserSummary>();

            foreach (var userSummary in userSummaries)
            {
                var user = userRoles.FirstOrDefault(o => o.ServiceNumber == userSummary.ServiceNumber);

                if(user == null)
                {
                    userRoles.Add(userSummary);
                }
            }

            return userRoles;
        }

        public async Task<AppUserSummary?> GetUserAsync(
            int appUserId,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            var user = await _db.AppUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == appUserId, cancellationToken);

            if (user is null)
            {
                return null;
            }

            var activeAssignments = await ActiveUserRolesQuery(now)
                .AsNoTracking()
                .Include(ur => ur.Role)
                .ToListAsync(cancellationToken);

            var activeRoles = activeAssignments
                .Where(assignment => UserOwnsAssignment(user, assignment))
                .Select(ur => ur.Role.Code)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(c => c)
                .ToList();

            var employees = await GetEmployeeLookupByEmailAsync(
                new[] { EmailKey(user) },
                cancellationToken);

            var employee = LookupEmployee(user, employees);
            return user.ToSummary(activeRoles, employee?.ServiceNumber, employee?.IsActive);
        }

        public async Task<List<UserRoleDetails>> GetUserRolesAsync(
            int appUserId,
            CancellationToken cancellationToken = default)
        {
            var user = await _db.AppUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == appUserId, cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException($"App user {appUserId} was not found.");
            }

            var userRoles = await _db.UserRoles
                .AsNoTracking()
                .Include(ur => ur.Role)
                .Where(ur => ur.ServiceNumber == user.ServiceNumber)
                .OrderBy(ur => ur.Role.Id)
                .ToListAsync(cancellationToken);

            var assignerServiceNumbers = userRoles.Select(ur => ur.AssignedByServiceNumber).Distinct().ToList();
            var assigners = await _db.AppUsers
                .AsNoTracking()
                .Where(u => assignerServiceNumbers.Contains(u.ServiceNumber))
                .ToDictionaryAsync(u => u.Id, u => u.ServiceNumber, cancellationToken);

            return userRoles.Select(ur => new UserRoleDetails
            {
                ServiceNumber = user.ServiceNumber,
                RoleId = ur.RoleId,
                RoleCode = ur.Role.Code,
                RoleName = ur.Role.Name,
                EffectiveFrom = ur.EffectiveFrom,
                EffectiveTo = ur.EffectiveTo,
                AssignedAt = ur.AssignedAt,
                AssignedByServiceNumber = ur.ServiceNumber
            }).ToList();
        }

        public async Task<UserRoleDetails> AssignRoleAsync(
    AssignRoleRequest request,
    CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                throw new ArgumentException("Request is required.", nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.RoleCode))
            {
                throw new ArgumentException("RoleCode is required.", nameof(request));
            }

            await _currentUser.EnsureLoadedAsync(cancellationToken);

            string roleCode = request.RoleCode.Trim().ToUpperInvariant();

            var role = await _db.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Code == roleCode, cancellationToken);

            if (role is null)
            {
                throw new KeyNotFoundException($"Role '{roleCode}' was not found.");
            }

            var appUser = await ResolveTargetUserAsync(request, cancellationToken);

            var existing = await _db.UserRoles
                .FirstOrDefaultAsync(
                    ur => ur.ServiceNumber == appUser.ServiceNumber && ur.RoleId == role.Id,
                    cancellationToken);

            if (existing is not null)
            {
                existing.EffectiveFrom = request.EffectiveFrom;
                existing.EffectiveTo = request.EffectiveTo;
                existing.AssignedAt = DateTime.UtcNow;
                existing.AssignedByServiceNumber = _currentUser.ServiceNumber;
            }
            else
            {
                existing = new UserRole
                {
                    ServiceNumber = appUser.ServiceNumber,
                    RoleId = role.Id,
                    EffectiveFrom = request.EffectiveFrom,
                    EffectiveTo = request.EffectiveTo,
                    AssignedAt = DateTime.UtcNow,
                    AssignedByServiceNumber = _currentUser.ServiceNumber
                };
                _db.UserRoles.Add(existing);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return new UserRoleDetails
            {
                ServiceNumber = appUser.ServiceNumber,
                RoleId = role.Id,
                RoleCode = role.Code,
                RoleName = role.Name,
                EffectiveFrom = existing.EffectiveFrom,
                EffectiveTo = existing.EffectiveTo,
                AssignedAt = existing.AssignedAt,
                AssignedByServiceNumber = _currentUser.ServiceNumber
            };
        }

        public async Task<bool> RevokeRoleAsync(
            string serviceNumber,
            string roleCode,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roleCode))
            {
                throw new ArgumentException("RoleCode is required.", nameof(roleCode));
            }

            var user = await _db.AppUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.ServiceNumber == serviceNumber, cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException($"App user {serviceNumber} was not found.");
            }

            string normalizedRoleCode = roleCode.Trim().ToUpperInvariant();

            var role = await _db.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Code == normalizedRoleCode, cancellationToken);

            if (role is null)
            {
                throw new KeyNotFoundException($"Role '{normalizedRoleCode}' was not found.");
            }

            var assignment = await _db.UserRoles
                .FirstOrDefaultAsync(
                    ur => ur.ServiceNumber == user.ServiceNumber && ur.RoleId == role.Id,
                    cancellationToken);

            if (assignment is null)
            {
                return false;
            }

            await _currentUser.EnsureLoadedAsync(cancellationToken);

            if (_currentUser.ServiceNumber == user.ServiceNumber
                && string.Equals(role.Code, RoleCodes.SystemAdmin, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("You cannot revoke your own SYSTEM_ADMIN role.");
            }

            _db.UserRoles.Remove(assignment);
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> SetUserActiveAsync(
            int appUserId,
            bool isActive,
            CancellationToken cancellationToken = default)
        {
            var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Id == appUserId, cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException($"App user {appUserId} was not found.");
            }

            await _currentUser.EnsureLoadedAsync(cancellationToken);

            if (_currentUser.ServiceNumber == user.ServiceNumber && !isActive)
            {
                throw new InvalidOperationException("You cannot deactivate your own account.");
            }

            user.IsActive = isActive;
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        private async Task<AppUser> ResolveTargetUserAsync(
            AssignRoleRequest request,
            CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(request.ServiceNumber))
            {
                string serviceNumber = request.ServiceNumber.Trim();
                var appUser = await _db.AppUsers.FirstOrDefaultAsync(o => o.ServiceNumber == serviceNumber);

                if(appUser != null)
                {
                    appUser.IsActive = true;
                    appUser.LastModifiedAt = DateTime.UtcNow;
                    appUser.LastModifiedBy = _currentUser.ServiceNumber;

                    await _db.SaveChangesAsync(cancellationToken);

                    return appUser;
                }

                var employeeDetails = await _dLRDbContext.DrlEmployeeDetails
                    .AsNoTracking()
                    .FirstOrDefaultAsync(o => o.SERVICE_NO == serviceNumber, cancellationToken);

                if (employeeDetails is null)
                {
                    throw new KeyNotFoundException($"Employee '{serviceNumber}' was not found.");
                }

                appUser = new AppUser
                {
                    CreatedAt = DateTime.UtcNow,
                    ServiceNumber = serviceNumber,
                    Email = employeeDetails.EMAIL ?? string.Empty,
                    EmployeeEmail = string.IsNullOrWhiteSpace(employeeDetails.EMAIL) ? null : employeeDetails.EMAIL,
                    DisplayName = $"{employeeDetails.FIRST_NAME} {employeeDetails.SURNAME}".Trim(),
                    ActiveDirectoryUsername = string.IsNullOrWhiteSpace(employeeDetails.USERID)
                        ? $"svc:{serviceNumber}"
                        : employeeDetails.USERID,
                    IsActive = true,
                    CreatedBy = _currentUser.ServiceNumber
                };

                await _db.AppUsers.AddAsync(appUser, cancellationToken);
                await _db.SaveChangesAsync(cancellationToken);
                return appUser;
            }

            throw new ArgumentException("AppUserId or ServiceNumber is required.", nameof(request));
        }

        private async Task<Dictionary<string, EmployeeLookup>> GetEmployeeLookupByEmailAsync(
            IEnumerable<string?> emails,
            CancellationToken cancellationToken)
        {
            var keys = emails
                .Where(email => !string.IsNullOrWhiteSpace(email))
                .Select(email => email!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (keys.Count == 0)
            {
                return new Dictionary<string, EmployeeLookup>(StringComparer.OrdinalIgnoreCase);
            }

            var employees = await _db.Employees
                .AsNoTracking()
                .Where(e => keys.Contains(e.EmailAddress))
                .Select(e => new EmployeeLookup
                {
                    EmailAddress = e.EmailAddress,
                    ServiceNumber = e.ServiceNumber,
                    IsActive = e.IsActive
                })
                .ToListAsync(cancellationToken);

            return employees
                .GroupBy(e => e.EmailAddress, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        }

        private static string? EmailKey(AppUser user)
        {
            return !string.IsNullOrWhiteSpace(user.EmployeeEmail) ? user.EmployeeEmail : user.Email;
        }

        private static EmployeeLookup? LookupEmployee(AppUser user, IReadOnlyDictionary<string, EmployeeLookup> employees)
        {
            var email = EmailKey(user);
            if (!string.IsNullOrWhiteSpace(email) && employees.TryGetValue(email, out var employee))
            {
                return employee;
            }

            if (!string.IsNullOrWhiteSpace(user.ServiceNumber))
            {
                return new EmployeeLookup
                {
                    EmailAddress = email ?? string.Empty,
                    ServiceNumber = user.ServiceNumber,
                    IsActive = user.IsActive
                };
            }

            return null;
        }

        private sealed class EmployeeLookup
        {
            public string EmailAddress { get; set; } = string.Empty;

            public string? ServiceNumber { get; set; }

            public bool IsActive { get; set; } = true;
        }

        private IQueryable<UserRole> ActiveUserRolesQuery(DateTime now)
        {
            return _db.UserRoles.Where(ur =>
                (ur.EffectiveFrom == null || ur.EffectiveFrom <= now) &&
                (ur.EffectiveTo == null || ur.EffectiveTo >= now));
        }

        private async Task<Dictionary<int, int>> GetAssignedUserCountsAsync(
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var users = await _db.AppUsers
                .AsNoTracking()
                .ToListAsync(cancellationToken);
            var assignments = await ActiveUserRolesQuery(now)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return assignments
                .GroupBy(assignment => assignment.RoleId)
                .ToDictionary(
                    group => group.Key,
                    group =>
                    {
                        int matchedUserCount = users.Count(user =>
                            group.Any(assignment => UserOwnsAssignment(user, assignment)));
                        int assignedIdentityCount = group
                            .Select(assignment => assignment.ServiceNumber)
                            .Where(serviceNumber => !string.IsNullOrWhiteSpace(serviceNumber))
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .Count();
                        return Math.Max(matchedUserCount, assignedIdentityCount);
                    });
        }

        private async Task<bool> HasActiveAssignmentAsync(
            int roleId,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            return await ActiveUserRolesQuery(now)
                .AsNoTracking()
                .AnyAsync(ur => ur.RoleId == roleId, cancellationToken);
        }

        private static bool UserOwnsAssignment(AppUser user, UserRole assignment)
        {
            var key = (assignment.ServiceNumber ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                return false;
            }

            return MatchesIdentity(key, user.ServiceNumber)
                || MatchesIdentity(key, user.Email)
                || MatchesIdentity(key, user.EmployeeEmail);
        }

        private static bool MatchesIdentity(string key, string? value)
        {
            return !string.IsNullOrWhiteSpace(value)
                && string.Equals(key, value.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        private static RoleDetails MapRole(Role role, int assignedUserCount = 0)
        {
            return new RoleDetails
            {
                Id = role.Id,
                Code = role.Code,
                Name = role.Name,
                Description = role.Description,
                IsActive = role.IsActive,
                IsSystemRole = RoleCodes.IsSystemRole(role.Code),
                AssignedUserCount = assignedUserCount,
                CreatedAt = role.CreatedAt,
                CreatedBy = role.CreatedBy,
                ModifiedAt = role.ModifiedAt,
                ModifiedBy = role.ModifiedBy,
                Permissions = role.RolePermissions
                    .Select(rp => rp.Permission.Code)
                    .OrderBy(code => code)
                    .ToList()
            };
        }

        private async Task<List<Permission>> ResolvePermissionsAsync(
            IEnumerable<string>? permissionCodes,
            CancellationToken cancellationToken)
        {
            var requestedCodes = (permissionCodes ?? Enumerable.Empty<string>())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (requestedCodes.Count == 0)
            {
                return new List<Permission>();
            }

            var permissions = await _db.Permissions
                .Where(p => requestedCodes.Contains(p.Code))
                .ToListAsync(cancellationToken);

            if (permissions.Count != requestedCodes.Count)
            {
                var foundCodes = permissions
                    .Select(p => p.Code)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var unknownCodes = requestedCodes
                    .Where(code => !foundCodes.Contains(code))
                    .ToList();

                throw new ArgumentException(
                    $"Unknown permission code(s): {string.Join(", ", unknownCodes)}.");
            }

            return permissions;
        }

        private static string GetPermissionGroup(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return string.Empty;
            }

            int dotIndex = code.IndexOf('.');
            return dotIndex > 0 ? code[..dotIndex] : code;
        }
    }
}