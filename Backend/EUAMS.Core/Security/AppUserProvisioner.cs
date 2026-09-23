using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EUAMS.Core.Security
{
    public class AppUserProvisioner : IAppUserProvisioner
    {
        private readonly DLRDbContext _dLRDbContext;
        private readonly EuamsDbContext _db;
        private readonly SecurityOptions _options;

        public AppUserProvisioner(EuamsDbContext db, IOptions<SecurityOptions> options, DLRDbContext dLRDbContext)
        {
            _db = db;
            _options = options.Value;
            _dLRDbContext = dLRDbContext;
        }

        public async Task<int> GetOrCreateAppUserAsync(string serviceNumber, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(serviceNumber))
            {
                throw new ArgumentException("Service number is required.", nameof(serviceNumber));
            }

            var existing = await _db.AppUsers
                .FirstOrDefaultAsync(
                    u => u.ActiveDirectoryUsername == serviceNumber
                        || u.Email == serviceNumber
                        || u.EmployeeEmail == serviceNumber,
                    cancellationToken);

            if (existing is null)
            {
                var employee = await _db.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        e => e.ServiceNumber == serviceNumber || e.EmailAddress == serviceNumber,
                        cancellationToken);

                if (employee is not null)
                {
                    existing = await _db.AppUsers.FirstOrDefaultAsync(
                        u => u.Email == employee.EmailAddress || u.EmployeeEmail == employee.EmailAddress,
                        cancellationToken);
                }
            }

            if (existing is not null)
            {
                existing.LastLoginAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(cancellationToken);

                return existing.Id;
            }

            if (!_options.AutoProvisionUsers)
            {
                throw new InvalidOperationException($"App user '{serviceNumber}' is not registered.");
            }

            var matchedEmployee = await _dLRDbContext.DrlEmployeeDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.SERVICE_NO == serviceNumber, cancellationToken);

            if (matchedEmployee is null)
            {
                throw new KeyNotFoundException($"Employee {serviceNumber} was not found!!");
            }

            var user = new AppUser
            {
                ServiceNumber = matchedEmployee.SERVICE_NO,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _db.AppUsers.Add(user);
            await _db.SaveChangesAsync(cancellationToken);

            return user.Id;
        }
    }
}