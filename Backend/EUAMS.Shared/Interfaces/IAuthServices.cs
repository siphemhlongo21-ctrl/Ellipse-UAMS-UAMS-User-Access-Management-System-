using EUAMS.Shared.DTOs.Auth;
using EUAMS.Shared.DTOs.Employee;

namespace EUAMS.Shared.Interfaces
{
    public interface IAuthServices
    {
        Task<AuthResponse> EmployeeLogin(string email, string password);

        Task<AuthResponse?> ValidateToken(string token);

        Task<USTEmployeeDetails> GetEmployeeDetails(string employeeEmail);
    }
}
