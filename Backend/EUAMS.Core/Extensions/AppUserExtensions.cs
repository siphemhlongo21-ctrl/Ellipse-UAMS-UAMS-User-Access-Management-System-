using EUAMS.Data.Entities;
using EUAMS.Data.Views;
using EUAMS.Shared.DTOs.Security;

namespace EUAMS.Core.Extensions
{
    public static class AppUserExtensions
    {
        public static AppUserSummary ToSummary(
            this AppUser user,
            List<string> activeRoles,
            UstEmployeeDetails? employee = null)
        {
            var employeeDisplayName = employee != null
                ? $"{employee.FIRST_NAME} {employee.SURNAME}".Trim()
                : null;

            return new AppUserSummary
            {
                Id = user.Id,
                IsActive = user.IsActive,
                ServiceNumber = user.ServiceNumber,
                Email = user.Email,
                ActiveDirectoryUsername = user.ActiveDirectoryUsername,
                DisplayName = !string.IsNullOrWhiteSpace(employeeDisplayName)
                    ? employeeDisplayName
                    : user.DisplayName,
                Department = employee?.DEPT_DESC,
                Roles = activeRoles
            };
        }

        public static AppUserSummary ToSummary(
            this AppUser user,
            List<string> activeRoles,
            string? serviceNumber,
            bool? isActive)
        {
            var summary = user.ToSummary(activeRoles);
            if (!string.IsNullOrWhiteSpace(serviceNumber))
            {
                summary.ServiceNumber = serviceNumber;
            }
            if (isActive.HasValue)
            {
                summary.IsActive = isActive.Value;
            }
            return summary;
        }
    }
}