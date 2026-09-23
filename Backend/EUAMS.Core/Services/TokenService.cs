using EUAMS.Shared.DTOs.Employee;
using EUAMS.Shared.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EUAMS.Core.Services
{
    public class TokenService : ITokenService
    {
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _accessTokenExpiryMinutes;
        private readonly ILookupUSTEmployeeServices _lookupUSTEmployeeServices;

        public TokenService(IConfiguration config, ILookupUSTEmployeeServices lookupUSTEmployeeServices)
        {
            _secretKey = config.GetValue<string>("ApiSettings:Secret") ?? throw new Exception("Secret key is missing");
            _issuer = config.GetValue<string>("ApiSettings:Issuer") ?? throw new Exception("Issuer is missing");
            _audience = config.GetValue<string>("ApiSettings:Audience") ?? throw new Exception("Audience is missing");
            _accessTokenExpiryMinutes = config.GetValue<int>("ApiSettings:AccessTokenExpiryMinutes", 60);
            _lookupUSTEmployeeServices = lookupUSTEmployeeServices;
        }

        private TokenValidationParameters GetTokenValidationParameters()
        {
            return new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidIssuer = _issuer,
                // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
                ClockSkew = TimeSpan.Zero,
            };
        }

        private Claim[] GetClaims(USTEmployeeDetails user)
        {
            return new[]
            {
                new Claim("service_number", user.ServiceNo),
                new Claim("post_id", user.PostNo ?? ""),
                new Claim(ClaimTypes.Name, user.FirstName),
                new Claim(ClaimTypes.Surname, user.Surname),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("manager_service_number", user.MangServNo ?? string.Empty),
                new Claim("is_manager", user.IsManager ? "Y" : "N")
            };
        }

        public string GenerateToken(USTEmployeeDetails user)
        {
            var claims = GetClaims(user);
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(_accessTokenExpiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<USTEmployeeDetails?> ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            try
            {
                tokenHandler.ValidateToken(token, GetTokenValidationParameters(), out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;

                var employeeEmail = jwtToken.Claims.First(x => x.Type == ClaimTypes.Email).Value;

                return await _lookupUSTEmployeeServices.GetEmployeeDetailsByEmail(employeeEmail);
            }
            catch (Exception ex)
            {
                //return null if token is invalid
                return null;
            }
        }
    }
}
