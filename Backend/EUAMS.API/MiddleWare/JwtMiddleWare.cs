using EUAMS.Shared.Interfaces;

namespace EUAMS.API.MiddleWare
{
    public class JwtMiddleWare
    {
        private readonly RequestDelegate _next;

        public JwtMiddleWare(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, IAuthServices authServices, ITokenService tokenService)
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (token != null)
                await attachUserToContext(context, authServices, token, tokenService);

            await _next(context);
        }

        private async Task attachUserToContext(HttpContext context, IAuthServices authServices,
            string token, ITokenService tokenService)
        {
            try
            {
                // attach user to context on successful jwt validation
                var employee = await tokenService.ValidateToken(token);

                if (employee == null) throw new Exception("Unauthorized user!!");

                context.Items["User"] = employee;
            }
            catch
            {
                // do nothing if jwt validation fails
                // user is not attached to context so request won't have access to secure routes
            }
        }
    }
}
