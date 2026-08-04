using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Auth;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(AppDbContext db, IJwtTokenService jwt) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email, ct))
            return Conflict(new { message = "E-mail já cadastrado." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Name = request.Name,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var memberships = await LoadMembershipsAsync(user.Id, ct);
        var token = jwt.GenerateToken(user.Id, user.Email, user.Name, user.IsSaasAdmin, null, null);
        return Ok(new AuthResponse(token, MapUser(user, memberships)));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Credenciais inválidas." });

        var memberships = await LoadMembershipsAsync(user.Id, ct);
        Guid? tenantId = request.TenantId;
        string? role = null;

        if (tenantId.HasValue)
        {
            var membership = memberships.FirstOrDefault(m => m.TenantId == tenantId);
            if (membership is null && !user.IsSaasAdmin)
                return Forbid();
            role = membership is not null ? EnumMapper.ToApi(membership.Role) : null;
        }
        else if (memberships.Count == 1)
        {
            tenantId = memberships[0].TenantId;
            role = EnumMapper.ToApi(memberships[0].Role);
        }

        var token = jwt.GenerateToken(user.Id, user.Email, user.Name, user.IsSaasAdmin, tenantId, role);
        return Ok(new AuthResponse(token, MapUser(user, memberships)));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout() => Ok(new { message = "Logout realizado." });

    [HttpGet("/api/v1/me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return NotFound();

        var memberships = await LoadMembershipsAsync(userId, ct);
        return Ok(MapUser(user, memberships));
    }

    private async Task<List<TenantMembership>> LoadMembershipsAsync(Guid userId, CancellationToken ct) =>
        await db.TenantMemberships
            .Include(m => m.Tenant)
            .Where(m => m.UserId == userId)
            .ToListAsync(ct);

    private static UserDto MapUser(User user, List<TenantMembership> memberships) =>
        new(user.Id, user.Email, user.Name, user.Phone, user.IsSaasAdmin,
            memberships.Select(DtoMappers.ToDto).ToList());
}
