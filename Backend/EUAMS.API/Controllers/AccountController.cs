using EUAMS.Shared.DTOs.Auth;
using EUAMS.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EUAMS.API.Controllers
{

    [Route("api/[controller]/[action]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAuthServices _authServices;
        private readonly ILogger<AccountController> _logger;

        public AccountController(IAuthServices authServices, ILogger<AccountController> logger)
        {
            _authServices = authServices;
            _logger = logger;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login(string username, string password, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _authServices.EmployeeLogin(username, password));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while authenticating employee {username}.");
                return Unauthorized(ex.Message);
            }
        }


        [HttpPost]
        [Authorize]
        public async Task<ActionResult<AuthResponse>> ValidateToken(CancellationToken cancellationToken)
        {
            try
            {
                var token = HttpContext.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

                return Ok(await _authServices.ValidateToken(token));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while validating user token.");
                throw;
            }
        }
    }
}
