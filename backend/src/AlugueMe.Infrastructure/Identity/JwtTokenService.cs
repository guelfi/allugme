using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AlugueMe.Infrastructure.Identity;

public class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    public string GenerateToken(Guid userId, string email, string name, bool isSaasAdmin, Guid? tenantId, string? role, bool isClient = false)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("name", name),
            new("is_saas_admin", isSaasAdmin.ToString().ToLowerInvariant()),
            new("is_client", isClient.ToString().ToLowerInvariant())
        };

        if (tenantId.HasValue)
            claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));
        if (!string.IsNullOrEmpty(role))
            claims.Add(new Claim(ClaimTypes.Role, role));
        else if (isClient)
            claims.Add(new Claim(ClaimTypes.Role, "client"));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            _options.Issuer,
            _options.Audience,
            claims,
            expires: DateTime.UtcNow.AddHours(_options.ExpirationHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
