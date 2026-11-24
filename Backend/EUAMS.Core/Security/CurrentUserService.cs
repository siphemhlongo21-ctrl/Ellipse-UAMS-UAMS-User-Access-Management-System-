using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EUAMS.Core.Security
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPermissionService _permissionService;

        private bool _loaded;
        private string _serviceNumber;
        private string _email;
        private string _displayName;

        private string _firstName;
        private string _surname;
        private string _postId;
        private bool _isManager;
        private List<string> _permissions = new List<string>();
        private List<string> _roles = new List<string>();

        public CurrentUserService(IHttpContextAccessor httpContextAccessor, IPermissionService permissionService)
        {
            _httpContextAccessor = httpContextAccessor;
            _permissionService = permissionService;
        }

        public bool IsAuthenticated => !string.IsNullOrWhiteSpace(ResolveServiceNumberFromPrincipal());

        public string ServiceNumber => _serviceNumber;

        public IReadOnlyCollection<string> Permissions => _permissions;

        public IReadOnlyCollection<string> Roles => _roles;

        public string Email => _email;

        public string DisplayName => _displayName;

        public string FirstName => _firstName;

        public string Surname => _surname;

        public string PostId => _postId;

        public bool HasPermission(string permissionCode) =>
            _permissions.Contains(permissionCode, StringComparer.OrdinalIgnoreCase);

        public bool HasAnyPermission(params string[] permissionCodes) =>
            permissionCodes.Any(HasPermission);

        public async Task EnsureLoadedAsync(CancellationToken cancellationToken = default)
        {
            if (_loaded)
            {
                return;
            }

            var serviceNumber = ResolveServiceNumberFromPrincipal();

            if (string.IsNullOrWhiteSpace(serviceNumber))
            {
                _loaded = true;
                return;
            }

            var principal = _httpContextAccessor.HttpContext?.User;
            _email = principal?.FindFirst(ClaimTypes.Email)?.Value ?? throw new Exception("Invalid employee email");
            _displayName = $"{principal?.FindFirst(ClaimTypes.Name)?.Value} {principal?.FindFirst(ClaimTypes.Surname)?.Value}";
            _serviceNumber = principal?.FindFirst("service_number")?.Value ?? throw new Exception("Invalid Employee Service Number");
            _isManager = principal?.FindFirst("is_manager")?.Value == "Y";
            _postId = principal?.FindFirst("post_id")?.Value ?? "";
            _firstName = principal?.FindFirst(ClaimTypes.Name)?.Value ?? throw new Exception("Invalid Employee Namer");
            _surname = principal?.FindFirst(ClaimTypes.Surname)?.Value ?? throw new Exception("Invalid Employee Surname");
            _roles.AddRange(await _permissionService.GetRolesForUserAsync(_serviceNumber, cancellationToken));

            if (!_roles.Any() || !_roles.Contains("EMPLOYEE"))
            {
                _roles.Add("EMPLOYEE");
            }

            if (_isManager && !_roles.Contains("LINE_MANAGER"))
            {
                _roles.Add("LINE_MANAGER");
            }

            foreach (var role in _roles)
            {
                _permissions.AddRange(await _permissionService.GetPermissionsForRole(role, cancellationToken));
            }

            _loaded = true;
        }

        private string? ResolveServiceNumberFromPrincipal()
        {
            var user = (USTEmployeeDetails)_httpContextAccessor.HttpContext.Items["User"];

            if (user == null)
            {
                return null;
            }

            return user.ServiceNo;
        }
    }
}
