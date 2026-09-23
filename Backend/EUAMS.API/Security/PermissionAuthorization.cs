using EUAMS.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace EUAMS.API.Security
{
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public PermissionRequirement(params string[] permissionCodes)
        {
            PermissionCodes = permissionCodes;
        }

        public IReadOnlyList<string> PermissionCodes { get; }
    }

    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly ICurrentUserService _currentUser;

        public PermissionAuthorizationHandler(ICurrentUserService currentUser)
        {
            _currentUser = currentUser;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            await _currentUser.EnsureLoadedAsync();

            if (!_currentUser.IsAuthenticated || _currentUser.ServiceNumber is null)
            {
                return;
            }

            if (_currentUser.HasAnyPermission(requirement.PermissionCodes.ToArray()))
            {
                context.Succeed(requirement);
            }
        }
    }

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
    public sealed class AuthorizePermissionAttribute : AuthorizeAttribute
    {
        public AuthorizePermissionAttribute(params string[] permissionCodes)
        {
            if (permissionCodes is null || permissionCodes.Length == 0)
            {
                throw new ArgumentException("At least one permission code is required.", nameof(permissionCodes));
            }

            Policy = PermissionPolicyProvider.BuildPolicyName(permissionCodes);
        }
    }

    public static class PermissionPolicyProvider
    {
        public const string Prefix = "Permission:";

        public static string BuildPolicyName(IEnumerable<string> permissionCodes) =>
            Prefix + string.Join('|', permissionCodes);

        public static string[] ParsePolicyName(string policyName) =>
            policyName[Prefix.Length..].Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    public class PermissionAuthorizationPolicyProvider : DefaultAuthorizationPolicyProvider
    {
        public PermissionAuthorizationPolicyProvider(IOptions<AuthorizationOptions> options)
            : base(options)
        {
        }

        public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            if (policyName.StartsWith(PermissionPolicyProvider.Prefix, StringComparison.Ordinal))
            {
                var permissions = PermissionPolicyProvider.ParsePolicyName(policyName);
                return new AuthorizationPolicyBuilder()
                    .AddRequirements(new PermissionRequirement(permissions))
                    .RequireAuthenticatedUser()
                    .Build();
            }

            return await base.GetPolicyAsync(policyName);
        }
    }
}
