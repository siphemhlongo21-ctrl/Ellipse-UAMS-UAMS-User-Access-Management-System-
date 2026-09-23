using EUAMS.Core.Lookups;
using EUAMS.Core.Notifications;
using EUAMS.Core.Reports;
using EUAMS.Core.Security;
using EUAMS.Core.Services;
using EUAMS.Core.Workflow;
using EUAMS.Data;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EUAMS.Core.Extensions
{
    public static class IServiceCollection_Extensions
    {
        public static void AddDbContext(this IServiceCollection services, IConfiguration Configuration)
        {
            services.AddDbContext<EuamsDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection"), options => { options.EnableRetryOnFailure(); options.CommandTimeout(180); }));

            services.AddDbContext<DLRDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DLRDbConnect"), options => { options.EnableRetryOnFailure(); options.CommandTimeout(180); }));

            services.AddDbContext<CesarDbContext>(options =>
            options.UseSqlServer(Configuration.GetConnectionString("CesarDbContext"), options => { options.EnableRetryOnFailure(); options.CommandTimeout(180); }));
        }

        public static void AddServices(this IServiceCollection services)
        {
            services.AddScoped<IRequestServices, RequestServices>();
            services.AddScoped<IDocumentAccessService, DocumentAccessServices>();
            services.AddScoped<IDocumentService, DocumentServices>();
            services.AddScoped<IRequestApproverActionService, RequestApproverActionServices>();
            services.AddScoped<RequestWorkflowWriter>();
            services.AddScoped<IPermissionService, Security.PermissionService>();
            services.AddScoped<IRolePermissionService, RolePermissionServices>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IRoleAdminService, RoleAdminService>();
            services.AddScoped<IRequestAccessService, RequestAccessService>();
            services.AddScoped<ILookupsAdminService, LookupsAdminService>();
            services.AddScoped<IReportService, ReportService>();
            services.AddScoped<IRequestNotificationService, RequestNotificationService>();
            services.AddScoped<ILookupUSTEmployeeServices, LookupUSTEmployeeServices>();
            services.AddHostedService<AccessExpiryReminderService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IAuthServices, AuthServices>();
        }
    }
}
