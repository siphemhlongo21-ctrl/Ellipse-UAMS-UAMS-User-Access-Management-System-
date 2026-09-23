using EUAMS.Shared.DTOs.Employee;

namespace EUAMS.Shared.Interfaces
{
    public interface IEmployeeServices
    {
        Task<EmployeeDetails> CreateEmployeeAsync(EmployeeDetails employeeDetails);

        Task<EmployeeDetails? > GetEmployeeByIdAsync(string email);

        Task<EmployeeDetails> UpdateEmployeeAsync(EmployeeDetails employeeDetails);

        Task<bool> DeleteEmployeeAsync(string email);
    }
}
