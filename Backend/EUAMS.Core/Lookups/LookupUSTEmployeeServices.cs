using EUAMS.Data;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using EUAMS.Core.Extensions;

namespace EUAMS.Core.Lookups
{
    public class LookupUSTEmployeeServices : ILookupUSTEmployeeServices
    {
        private readonly DLRDbContext _context;

        public LookupUSTEmployeeServices(DLRDbContext context)
        {
            _context = context;
        }

        public async Task<USTEmployeeDetails> GetEmployee(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
            {
                throw new ArgumentException("Email or service number is required.");
            }

            var key = identifier.Trim();

            try
            {
                if (key.Contains('@'))
                {
                    return await GetEmployeeDetailsByEmail(key);
                }

                return await GetEmployeeDetailsByServiceNumber(key);
            }
            catch (KeyNotFoundException)
            {
                throw new KeyNotFoundException("Check the email or service number");
            }
        }

        public async Task<List<USTEmployeeDetails>> GetEmployees(string searchString)
        {
            if (string.IsNullOrWhiteSpace(searchString))
            {
                return new List<USTEmployeeDetails>();
            }

            var term = searchString.Trim();
            if (term.Length < 2)
            {
                return new List<USTEmployeeDetails>();
            }

            var pattern = ToSqlLikeContainsPattern(term);

            try
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));

                var employees = await _context.DrlEmployeeDetails
                    .AsNoTracking()
                    .Where(employee =>
                        (employee.SERVICE_NO != null && EF.Functions.Like(employee.SERVICE_NO, pattern))
                        || (employee.EMAIL != null && EF.Functions.Like(employee.EMAIL, pattern))
                        || (employee.FIRST_NAME != null && EF.Functions.Like(employee.FIRST_NAME, pattern))
                        || (employee.PREF_NAME != null && EF.Functions.Like(employee.PREF_NAME, pattern))
                        || (employee.SECOND_NAME != null && EF.Functions.Like(employee.SECOND_NAME, pattern))
                        || (employee.SURNAME != null && EF.Functions.Like(employee.SURNAME, pattern))
                        || (employee.USERID != null && EF.Functions.Like(employee.USERID, pattern)))
                    .Take(50)
                    .ToListAsync(timeout.Token);

                return employees
                    .OrderBy(employee => employee.SURNAME)
                    .ThenBy(employee => employee.FIRST_NAME)
                    .Select(employee => employee.ToDto())
                    .ToList();
            }
            catch (OperationCanceledException)
            {
                throw new TimeoutException("The employee directory took too long to respond.");
            }
        }

        private static string ToSqlLikeContainsPattern(string term)
        {
            var escaped = term
                .Replace("[", "[[]", StringComparison.Ordinal)
                .Replace("%", "[%]", StringComparison.Ordinal)
                .Replace("_", "[_]", StringComparison.Ordinal);

            return $"%{escaped}%";
        }

        public async Task<USTEmployeeDetails> GetEmployeeDetailsByServiceNumber(string serviceNumber)
        {
            var key = serviceNumber?.Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException("Email or service number is required.");
            }

            var employeeDetails = await _context.DrlEmployeeDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(o =>
                    o.SERVICE_NO != null && o.SERVICE_NO.ToLower() == key.ToLower());

            if (employeeDetails == null)
            {
                throw new KeyNotFoundException("Invalid employee service number");
            }

            return employeeDetails.ToDto();
        }

        public async Task<USTEmployeeDetails> GetEmployeeDetailsByEmail(string employeeEmail)
        {
            var key = employeeEmail?.Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException("Email or service number is required.");
            }

            var employeeDetails = await _context.DrlEmployeeDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(o =>
                    o.EMAIL != null && o.EMAIL.ToLower() == key.ToLower());

            if (employeeDetails == null)
            {
                throw new KeyNotFoundException("Invalid employee email");
            }

            return employeeDetails.ToDto();
        }

        public async Task<List<USTEmployeeDetails>> GetEmployeesReportingToManagerByManagerServiceNumber(string serviceNumber)
        {
            var employeesReportingToManager = await _context.DrlEmployeeDetails.Where(o => o.MANGSERVNO.ToLower() == serviceNumber.ToLower()).ToListAsync();

            return employeesReportingToManager.Select(o => o.ToDto()).ToList();
        }

        public async Task<USTEmployeeDetails> GetEmployeeManagerDetailsByEmployeeServiceNumber(string serviceNumber)
        {
            var employeeManagerServiceNumber = _context.DrlEmployeeDetails.FirstOrDefault(o => o.SERVICE_NO.ToLower() == serviceNumber.ToLower()) ?.MANGSERVNO;

            if (employeeManagerServiceNumber == null)
            {
                throw new KeyNotFoundException("Employee manager not found");
            }

            return await GetEmployeeDetailsByServiceNumber(employeeManagerServiceNumber);
        }

        public async Task<USTEmployeeDetails> GetEmployeeManagerDetailsByEmployeeEmail(string employeeEmail)
        {
            var employeeManagerServiceNumber = _context.DrlEmployeeDetails.FirstOrDefault(o => o.EMAIL.ToLower() == employeeEmail.ToLower())?.MANGSERVNO;

            if (employeeManagerServiceNumber == null)
            {
                throw new KeyNotFoundException("Employee manager not found");
            }

            return await GetEmployeeDetailsByServiceNumber(employeeManagerServiceNumber);
        }
    }
}
