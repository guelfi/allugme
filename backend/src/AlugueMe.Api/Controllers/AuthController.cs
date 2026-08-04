using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Auth;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
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
    public async Task<ActionResult<object>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "E-mail já cadastrado." });

        if (string.IsNullOrWhiteSpace(request.BusinessName))
            return BadRequest(new { message = "Informe o nome da imobiliária ou do corretor." });

        var accountType = (request.AccountType ?? "agency").Trim().ToLowerInvariant();
        var isIndependent = accountType is "independent" or "corretor" or "broker";
        var plan = (request.Plan ?? "monthly").Trim().ToLowerInvariant();
        var planLabel = plan is "yearly" or "anual" ? "Anual (R$ 500,00)" : "Mensal (R$ 59,00)";

        var slug = await UniqueSlugAsync(request.BusinessName, ct);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = request.Name,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };
        db.Users.Add(user);

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.BusinessName.Trim(),
            Slug = slug,
            Type = isIndependent ? TenantType.Independent : TenantType.Agency,
            Status = TenantStatus.PendingPayment,
            ThemeKey = "moderno"
        };
        db.Tenants.Add(tenant);
        db.TenantSettings.Add(new TenantSettings
        {
            TenantId = tenant.Id,
            BufferMinutes = 60,
            VisitDurationMinutes = 60,
            WhatsAppNotifyEnabled = false
        });

        var role = isIndependent ? MembershipRole.IndependentBroker : MembershipRole.AgencyAdmin;
        db.TenantMemberships.Add(new TenantMembership
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = tenant.Id,
            Role = role
        });

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            message =
                "Cadastro recebido. Realize o pagamento via Pix e aguarde a liberação pelo administrador do Allugme para acessar o painel.",
            plan = planLabel,
            paymentMethod = "pix",
            tenant = new { tenant.Id, tenant.Name, tenant.Slug, status = "pending_payment" },
            nextStep = "Após o Pix, o administrador ativa sua conta. Você receberá confirmação no e-mail cadastrado."
        });
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

        if (!user.IsSaasAdmin && tenantId.HasValue)
        {
            var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
            if (tenant?.Status == TenantStatus.PendingPayment)
                return StatusCode(StatusCodes.Status402PaymentRequired, new
                {
                    message = "Conta aguardando confirmação de pagamento Pix pelo administrador."
                });
            if (tenant?.Status == TenantStatus.Suspended)
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Conta suspensa. Fale com o suporte Allugme."
                });
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

    private async Task<string> UniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = Slugify(name);
        var slug = baseSlug;
        var i = 2;
        while (await db.Tenants.AnyAsync(t => t.Slug == slug, ct))
        {
            slug = $"{baseSlug}-{i}";
            i++;
        }
        return slug;
    }

    private static string Slugify(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        var ascii = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        ascii = Regex.Replace(ascii, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(ascii) ? $"conta-{Guid.NewGuid():N}"[..12] : ascii;
    }
}
