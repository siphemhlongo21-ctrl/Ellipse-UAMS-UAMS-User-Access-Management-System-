using EUAMS.Shared.DTOs.Employee;

namespace EUAMS.Shared.Interfaces
{
    public interface ILookupUSTEmployeeServices
    {
        Task<USTEmployeeDetails> GetEmployee(string identifier);

        Task<List<USTEmployeeDetails>> GetEmployees(string searchString);

        Task<USTEmployeeDetails> GetEmployeeDetailsByServiceNumber(string serviceNumber);

        Task<USTEmployeeDetails> GetEmployeeDetailsByEmail(string employeeEmail);

        Task<List<USTEmployeeDetails>> GetEmployeesReportingToManagerByManagerServiceNumber(string serviceNumber);

        Task<USTEmployeeDetails> GetEmployeeManagerDetailsByEmployeeServiceNumber(string serviceNumber);

        Task<USTEmployeeDetails> GetEmployeeManagerDetailsByEmployeeEmail(string employeeEmail);
    }
}
