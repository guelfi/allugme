using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Brokers;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Email;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/brokers")]
[Authorize]
public class BrokersController(
    AppDbContext db,
    IFileStorage storage,
    TransactionalEmailService emails) : ControllerBase
{
    private const int InviteDays = 7;
    private static readonly string[] AllowedAvatarContentTypes = ["image/jpeg", "image/png", "image/webp"];

    [HttpPost("me/avatar")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<object>> UploadMyAvatar(IFormFile file, CancellationToken ct)
    {
        if (User.IsSaasAdmin() && string.IsNullOrEmpty(User.GetRole()))
            return Forbid();

        if (file.Length == 0 || file.Length > 5 * 1024 * 1024 ||
            !AllowedAvatarContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Envie uma foto JPG, PNG ou WEBP de até 5MB." });

        var userId = User.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return NotFound();

        var previousPath = user.AvatarPath;
        await using var stream = file.OpenReadStream();
        user.AvatarPath = await storage.SaveAsync(stream, file.FileName, file.ContentType, ct);
        user.MissingAvatarLoginCount = 0;
        await db.SaveChangesAsync(ct);

        if (!string.IsNullOrEmpty(previousPath))
            await storage.DeleteAsync(previousPath, ct);

        return Ok(new { avatarUrl = storage.GetPublicUrl(user.AvatarPath) });
    }

    [HttpGet]
    public async Task<ActionResult<TeamResponse>> List([FromQuery] Guid? tenantId, CancellationToken ct)
    {
        Guid? resolvedTenantId = User.GetTenantId() ?? tenantId;
        if (resolvedTenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        if (!User.IsSaasAdmin() && User.GetTenantId() != resolvedTenantId)
            return Forbid();

        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == resolvedTenantId, ct);
        if (tenant is null)
            return NotFound();

        var members = await db.TenantMemberships
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.TenantId == resolvedTenantId)
            .OrderBy(m => m.Role)
            .ThenBy(m => m.User.Name)
            .ToListAsync(ct);

        var currentUserId = User.GetUserId();
        var seats = members.Select(m => ToSeat(m, currentUserId)).ToList();

        var usedSeats = members.Count(m => m.Status != MembershipStatus.Inactive);
        var quota = BuildQuota(tenant, usedSeats, User);
        if (User.IsSaasAdmin() && string.IsNullOrEmpty(User.GetRole()))
            quota = quota with { CanManageBrokers = false };

        return Ok(new TeamResponse(quota, seats));
    }

    [HttpPost("invite")]
    public async Task<ActionResult<BrokerSeatDto>> Invite([FromBody] InviteBrokerRequest request, CancellationToken ct)
    {
        var gate = await EnsureCanManageAsync(ct);
        if (gate.Result is not null) return gate.Result;
        var tenant = gate.Tenant!;

        var used = await db.TenantMemberships.CountAsync(
            m => m.TenantId == tenant.Id && m.Status != MembershipStatus.Inactive, ct);
        if (used >= tenant.MaxBrokerSlots)
            return Conflict(new
            {
                message =
                    $"Limite de {tenant.MaxBrokerSlots} assentos atingido. Contrate corretores extras com o administrador Allugme."
            });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "E-mail já cadastrado." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = request.Name.Trim(),
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)))
        };
        db.Users.Add(user);

        var membership = new TenantMembership
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = tenant.Id,
            Role = MembershipRole.Broker,
            Status = MembershipStatus.Invited
        };
        db.TenantMemberships.Add(membership);

        var rawToken = CreateRawToken();
        db.BrokerInviteTokens.Add(new BrokerInviteToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = tenant.Id,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddDays(InviteDays),
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        await emails.SendBrokerInviteAsync(user, tenant, rawToken, ct);

        return Created($"/api/v1/brokers/{user.Id}", ToSeat(membership, user, false));
    }

    [HttpPost("{userId:guid}/resend-invite")]
    public async Task<IActionResult> ResendInvite(Guid userId, CancellationToken ct)
    {
        var gate = await EnsureCanManageAsync(ct);
        if (gate.Result is not null) return gate.Result;
        var tenant = gate.Tenant!;

        var membership = await db.TenantMemberships
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.TenantId == tenant.Id && m.UserId == userId, ct);
        if (membership is null)
            return NotFound();
        if (membership.Status == MembershipStatus.Inactive)
        {
            var used = await db.TenantMemberships.CountAsync(
                m => m.TenantId == tenant.Id && m.Status != MembershipStatus.Inactive, ct);
            if (used >= tenant.MaxBrokerSlots)
                return Conflict(new
                {
                    message = $"Limite de {tenant.MaxBrokerSlots} assentos atingido. Libere um assento antes de enviar um novo convite."
                });
        }
        membership.Status = MembershipStatus.Invited;

        var now = DateTime.UtcNow;
        var existing = await db.BrokerInviteTokens
            .Where(t => t.UserId == userId && t.UsedAt == null && t.ExpiresAt > now)
            .ToListAsync(ct);
        foreach (var old in existing)
            old.UsedAt = now;

        var rawToken = CreateRawToken();
        db.BrokerInviteTokens.Add(new BrokerInviteToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = tenant.Id,
            TokenHash = HashToken(rawToken),
            ExpiresAt = now.AddDays(InviteDays),
            CreatedAt = now
        });
        await db.SaveChangesAsync(ct);
        await emails.SendBrokerInviteAsync(membership.User, tenant, rawToken, ct);
        return Ok(new { message = "Convite reenviado." });
    }

    [HttpPost("{userId:guid}/deactivate")]
    public async Task<ActionResult<BrokerSeatDto>> Deactivate(Guid userId, CancellationToken ct)
    {
        var gate = await EnsureCanManageAsync(ct);
        if (gate.Result is not null) return gate.Result;
        var tenant = gate.Tenant!;

        var membership = await db.TenantMemberships
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.TenantId == tenant.Id && m.UserId == userId, ct);
        if (membership is null)
            return NotFound();

        if (membership.Role == MembershipRole.AgencyAdmin)
            return BadRequest(new { message = "Não é possível inativar o administrador da imobiliária." });

        if (membership.UserId == User.GetUserId())
            return BadRequest(new { message = "Você não pode inativar a si mesmo." });

        membership.Status = MembershipStatus.Inactive;
        var now = DateTime.UtcNow;
        var pendingInvites = await db.BrokerInviteTokens
            .Where(t => t.UserId == userId && t.TenantId == tenant.Id && t.UsedAt == null)
            .ToListAsync(ct);
        foreach (var invite in pendingInvites)
            invite.UsedAt = now;

        await db.SaveChangesAsync(ct);
        return Ok(ToSeat(membership, membership.User, false));
    }

    private async Task<(ActionResult? Result, Tenant? Tenant)> EnsureCanManageAsync(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return (BadRequest(new { message = "Contexto de tenant não definido." }), null);

        if (User.GetRole() is not "agency_admin")
            return (Forbid(), null);

        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant is null)
            return (NotFound(), null);

        if (tenant.Type != TenantType.Agency)
            return (StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Corretores independentes não podem cadastrar outros corretores."
            }), null);

        return (null, tenant);
    }

    private BrokerSeatDto ToSeat(TenantMembership m, Guid currentUserId) =>
        ToSeat(m, m.User, m.UserId == currentUserId);

    private BrokerSeatDto ToSeat(TenantMembership m, User user, bool isCurrent) =>
        new(
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            EnumMapper.ToApi(m.Role),
            EnumMapper.ToApi(m.Status),
            m.CreatedAt,
            isCurrent,
            string.IsNullOrEmpty(user.AvatarPath) ? null : storage.GetPublicUrl(user.AvatarPath));

    private static BrokerQuotaDto BuildQuota(Tenant tenant, int used, ClaimsPrincipal user)
    {
        var canManage = tenant.Type == TenantType.Agency
                        && (user.GetRole() is "agency_admin" || user.IsSaasAdmin());
        return new BrokerQuotaDto(
            EnumMapper.ToApi(tenant.Type),
            DtoMappers.NormalizePlan(tenant.Plan),
            tenant.IncludedBrokerSlots,
            tenant.ExtraBrokerSlots,
            used,
            tenant.MaxBrokerSlots,
            Math.Max(0, tenant.MaxBrokerSlots - used),
            canManage);
    }

    private static string CreateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
