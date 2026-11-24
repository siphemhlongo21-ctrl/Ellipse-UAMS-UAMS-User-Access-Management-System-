using EUAMS.Shared.DTOs.Auth;
using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace EUAMS.Core.Services
{
    public class AuthServices : IAuthServices
    {
        private readonly ILookupUSTEmployeeServices _lookupUSTEmployeeServices;
        private readonly IConfiguration _configuration;
        private readonly ITokenService _tokenService;
        private readonly IPermissionService _permissionService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<AuthServices> _logger; 


        public AuthServices(ILogger<AuthServices> logger, ILookupUSTEmployeeServices lookupUSTEmployeeServices, IConfiguration configuration, ITokenService tokenService, IPermissionService permissionService, ICurrentUserService currentUserService)
        {
            _lookupUSTEmployeeServices = lookupUSTEmployeeServices;
            _configuration = configuration;
            _tokenService = tokenService;
            _permissionService = permissionService;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<AuthResponse?> ValidateToken(string token)
        {
            await _currentUserService.EnsureLoadedAsync();

            var employee = await _tokenService.ValidateToken(token);

            if (employee == null)
            {
                return null;
            }

            token = _tokenService.GenerateToken(employee);

            return new AuthResponse(employee, token, _currentUserService.Roles.ToList(), _currentUserService.Permissions.ToList());
        }

        public async Task<AuthResponse> EmployeeLogin(string username, string password)
        {
            _logger?.LogInformation(">>> EmployeeLogin STARTED for username: {Username}", username);

            string token = string.Empty;
            USTEmployeeDetails? employee = null;
            var permissions = new List<string>();

            var http = new HttpClient
            {
                BaseAddress = new Uri(_configuration.GetValue<string>("ApiSettings:LoginApiUrl"))
            };

            var data = new
            {
                Username = username,
                Password = password
            };

            var response = await http.PostAsJsonAsync($"/api/ad/user", data);

            if (response == null || !response.IsSuccessStatusCode)
            {
                throw new Exception("Incorrect login details");
            }

            var responseData = await response.Content.ReadAsStringAsync();

            if (responseData.Contains("Unauthorized"))
            {
                throw new Exception("Incorrect login details");
            }

            employee = await GetEmployeeDetails(username);

            _logger?.LogInformation("Employee details retrieved: ServiceNo={ServiceNo}, Email={Email}",
        employee?.ServiceNo, employee?.Email);

            if (employee == null)
            {
                throw new KeyNotFoundException("Employee not found");
            }

            token = _tokenService.GenerateToken(employee);
            var roles = await _permissionService.GetRolesForUserAsync(employee.ServiceNo);
            permissions.AddRange(await _permissionService.GetPermissionsForUserAsync(employee.ServiceNo));

            if (string.IsNullOrEmpty(token) || employee == null)
            {
                throw new KeyNotFoundException("Employee not found");
            }

            if (roles.Count == 0 || !roles.Contains("EMPLOYEE"))
            {
                roles.Add("EMPLOYEE");
                permissions.AddRange(await _permissionService.GetPermissionsForRole("EMPLOYEE"));
            }

            if (employee.IsManager && !roles.Contains("LINE_MANAGER"))
            {
                roles.Add("LINE_MANAGER");
                permissions.AddRange(await _permissionService.GetPermissionsForRole("LINE_MANAGER"));
            }

            return new AuthResponse(employee, token, roles, permissions);
        }

        public async Task<USTEmployeeDetails> GetEmployeeDetails(string employeeEmail)
        {
            return await _lookupUSTEmployeeServices.GetEmployeeDetailsByEmail(employeeEmail);
        }
    }
}