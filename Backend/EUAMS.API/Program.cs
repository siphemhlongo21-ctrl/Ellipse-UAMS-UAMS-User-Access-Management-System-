using EUAMS.API.MiddleWare;
using EUAMS.API.Security;
using EUAMS.Core.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

namespace EUAMS.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var isDev = builder.Environment.IsDevelopment();

            builder.Services.AddHttpContextAccessor();
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Ellipse API",
                    Version = "v1",
                    Description = isDev
                        ? "Ellipse User Access Management API. Development: AdUsername and/or Entra Bearer when AzureAd is configured."
                        : "Ellipse User Access Management API. Authenticate with Entra ID Bearer token."
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer"
                });
            });

            builder.Services.AddDbContext(builder.Configuration);
            builder.Services.AddServices();

            builder.Services.AddAuthorization(options =>
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            });
            builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionAuthorizationPolicyProvider>();
            builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

            var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("EllipseFrontend", policy =>
                {
                    policy
                        .WithOrigins("*")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
                    | ForwardedHeaders.XForwardedProto;
                // IIS / ARR on the same host — clear known networks/proxies so headers are accepted.
                options.KnownIPNetworks.Clear();
                options.KnownProxies.Clear();
            });


            var t = builder.Configuration["ApiSettings:Issuer"];

            builder.Services.AddAuthentication("Bearer")
                    .AddJwtBearer("Bearer", options =>
                    {
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidateAudience = true,
                            ValidateLifetime = true,
                            ValidateIssuerSigningKey = true,
                            ValidIssuer = builder.Configuration.GetValue<string>("ApiSettings:Issuer"),
                            ValidAudience = builder.Configuration.GetValue<string>("ApiSettings:Audience"),
                            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration.GetValue<string>("ApiSettings:Secret")))
                        };
                    });

            var app = builder.Build();

            app.UseForwardedHeaders();
            app.UseMiddleware<JwtMiddleWare>();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Ellipse API v1");
                    options.DocumentTitle = "Ellipse API — Swagger";
                    options.DisplayRequestDuration();
                });
            }
            else if (builder.Configuration.GetValue("HttpsRedirection:Enabled", false))
            {
                // Off by default — IIS API is often HTTP-only (e.g. :30) behind ARR.
                app.UseHttpsRedirection();
            }

            app.UseCors("EllipseFrontend");
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            if (app.Environment.IsDevelopment())
            {
                app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
            }

            app.Run();
        }

    }
}
