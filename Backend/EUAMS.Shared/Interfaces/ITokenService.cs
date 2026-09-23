using EUAMS.Shared.DTOs.Employee;

namespace EUAMS.Shared.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(USTEmployeeDetails user);

        Task<USTEmployeeDetails?> ValidateToken(string token);
    }
}
