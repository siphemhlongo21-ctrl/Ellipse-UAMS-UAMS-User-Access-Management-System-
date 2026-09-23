using EUAMS.Data;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using EUAMS.Core.Extensions;

namespace EUAMS.Core.Services
{
    public class EmployeeServices : IEmployeeServices
    {
        private readonly EuamsDbContext _context;
        public EmployeeServices(EuamsDbContext context)
        {
            _context = context;
        }
        public async Task<EmployeeDetails> CreateEmployeeAsync(EmployeeDetails employeeDetails)
        {
            var employee = employeeDetails.ToEntity();

            await _context.Employees.AddAsync(employee);
            await _context.SaveChangesAsync();

            return employee.ToDetails();
        }
        public async Task<EmployeeDetails?> GetEmployeeByIdAsync(string email)
        {
            var employee = await _context.Employees.FindAsync(email);
          
            return employee?.ToDetails();
        }
        public async Task<EmployeeDetails> UpdateEmployeeAsync(EmployeeDetails employeeDetails)
        {
            var employee = await _context.Employees.FindAsync(employeeDetails.EmailAddress);
            if (employee == null)
            {
                return null;
            }
            employee.FirstName=employeeDetails.FirstName;
            employee.Surname=employeeDetails.Surname;
            employee.ContactNumber=employeeDetails.ContactNumber;
            employee.ServiceNumber=employeeDetails.ServiceNumber;
            employee.Department=employeeDetails.Department;
            employee.Branch=employeeDetails.Branch;
            employee.Designation=employeeDetails.Designation;
            employee.ActiveDirectoryUsername=employeeDetails.ActiveDirectoryUsername;

            await _context.SaveChangesAsync();
            return employee.ToDetails();
        }
        public async Task<bool> DeleteEmployeeAsync(string email)
        {
            var employee = await _context.Employees.FindAsync(email);
            if (employee == null)
            {
                return false;
            }
            employee.IsActive = false;
            await _context.SaveChangesAsync();
            return true;   
        }
    }
}
