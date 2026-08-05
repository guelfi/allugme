using System.Security.Claims;
using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Brokers;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/brokers")]
[Authorize]
public class BrokersController(AppDbContext db, IFileStorage storage) : ControllerBase
{
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
        var seats = members.Select(m => new BrokerSeatDto(
            m.UserId,
            m.User.Name,
            m.User.Email,
            m.User.Phone,
            EnumMapper.ToApi(m.Role),
            m.CreatedAt,
            m.UserId == currentUserId,
            string.IsNullOrEmpty(m.User.AvatarPath) ? null : storage.GetPublicUrl(m.User.AvatarPath))).ToList();

        var quota = BuildQuota(tenant, seats.Count, User);
        // SaaS nunca gerencia equipe do tenant
        if (User.IsSaasAdmin() && string.IsNullOrEmpty(User.GetRole()))
        {
            quota = quota with { CanManageBrokers = false };
        }

        return Ok(new TeamResponse(quota, seats));
    }

    [HttpPost]
    public async Task<ActionResult<BrokerSeatDto>> Create([FromBody] CreateBrokerRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        if (User.GetRole() is not "agency_admin")
            return Forbid();

        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant is null)
            return NotFound();

        if (tenant.Type != TenantType.Agency)
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Corretores independentes não podem cadastrar outros corretores."
            });

        var used = await db.TenantMemberships.CountAsync(m => m.TenantId == tenantId, ct);
        if (used >= tenant.MaxBrokerSlots)
            return Conflict(new
            {
                message =
                    $"Limite de {tenant.MaxBrokerSlots} assentos atingido. Contrate corretores extras com o administrador Allugme."
            });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "E-mail já cadastrado." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "Senha deve ter ao menos 6 caracteres." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = request.Name.Trim(),
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };
        db.Users.Add(user);

        var membership = new TenantMembership
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = tenant.Id,
            Role = MembershipRole.Broker
        };
        db.TenantMemberships.Add(membership);
        await db.SaveChangesAsync(ct);

        return Created($"/api/v1/brokers/{user.Id}", new BrokerSeatDto(
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            EnumMapper.ToApi(membership.Role),
            membership.CreatedAt,
            false,
            null));
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Remove(Guid userId, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        if (User.GetRole() is not "agency_admin")
            return Forbid();

        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant is null)
            return NotFound();

        if (tenant.Type != TenantType.Agency)
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Corretores independentes não podem gerenciar equipe."
            });

        var membership = await db.TenantMemberships
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.TenantId == tenantId && m.UserId == userId, ct);
        if (membership is null)
            return NotFound();

        if (membership.Role == MembershipRole.AgencyAdmin)
            return BadRequest(new { message = "Não é possível remover o administrador da imobiliária." });

        if (membership.UserId == User.GetUserId())
            return BadRequest(new { message = "Você não pode remover a si mesmo." });

        db.TenantMemberships.Remove(membership);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

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
}
