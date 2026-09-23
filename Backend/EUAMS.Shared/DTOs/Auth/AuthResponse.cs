using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.DTOs.Security;

namespace EUAMS.Shared.DTOs.Auth
{
    public class AuthResponse
    {
        public string Token { get; init; }

        public CurrentUserDetails User { get; init; } = new CurrentUserDetails();

        public AuthResponse(USTEmployeeDetails employeeDetails, string token, List<string> roles, List<string> permissions)
        {
            User.ServiceNumber = employeeDetails.ServiceNo;
            User.FirstName = employeeDetails.FirstName;
            User.Surname = employeeDetails.Surname;
            User.Email = employeeDetails.Email;
            User.ManagerName = employeeDetails.ManagerName;
            User.MangServNo = employeeDetails.MangServNo;
            User.PostNo = employeeDetails.PostNo;
            User.DeptDesc = employeeDetails.DeptDesc;
            User.BranchDesc = employeeDetails.BranchDesc;
            User.UserId = employeeDetails.UserId;
            User.Designation = employeeDetails.Designation;
            Token = token;
            User.Roles = roles;
            User.Permissions = permissions;
        }
    }
}
