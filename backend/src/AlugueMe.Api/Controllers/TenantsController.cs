using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Tenants;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/tenants")]
[Authorize]
public class TenantsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TenantDto>>> List(CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var tenants = await db.Tenants.OrderBy(t => t.Name).ToListAsync(ct);
        return Ok(tenants.Select(DtoMappers.ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TenantDto>> Get(Guid id, CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tenant is null)
            return NotFound();

        return Ok(DtoMappers.ToDto(tenant));
    }

    [HttpPost]
    public async Task<ActionResult<TenantDto>> Create([FromBody] CreateTenantRequest request, CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var slug = request.Slug.Trim().ToLowerInvariant();
        if (ReservedTenantSlugs.IsReserved(slug))
            return BadRequest(new { message = "Slug reservado pelo sistema. Escolha outro." });

        if (await db.Tenants.AnyAsync(t => t.Slug == slug, ct))
            return Conflict(new { message = "Slug já existe." });

        var isIndependent = EnumMapper.ParseTenantType(request.Type) == TenantType.Independent;
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = slug,
            Type = isIndependent ? TenantType.Independent : TenantType.Agency,
            ThemeKey = request.ThemeKey,
            Status = TenantStatus.Active,
            Plan = DtoMappers.NormalizePlan(request.Plan),
            IncludedBrokerSlots = isIndependent ? 1 : 5,
            ExtraBrokerSlots = isIndependent ? 0 : Math.Max(0, request.ExtraBrokerSlots ?? 0)
        };
        db.Tenants.Add(tenant);
        db.TenantSettings.Add(new TenantSettings { TenantId = tenant.Id });

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = request.AdminEmail.Trim().ToLowerInvariant(),
            Name = request.AdminName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword)
        };
        db.Users.Add(admin);
        db.TenantMemberships.Add(new TenantMembership
        {
            Id = Guid.NewGuid(),
            UserId = admin.Id,
            TenantId = tenant.Id,
            Role = tenant.Type == TenantType.Independent ? MembershipRole.IndependentBroker : MembershipRole.AgencyAdmin
        });

        await db.SaveChangesAsync(ct);
        return Created($"/api/v1/tenants/{tenant.Id}", DtoMappers.ToDto(tenant));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TenantDto>> PatchStatus(Guid id, [FromBody] PatchTenantStatusRequest request, CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var tenant = await db.Tenants.FindAsync([id], ct);
        if (tenant is null)
            return NotFound();

        tenant.Status = EnumMapper.ParseTenantStatus(request.Status);
        await db.SaveChangesAsync(ct);
        return Ok(DtoMappers.ToDto(tenant));
    }

    [HttpPatch("{id:guid}/plan")]
    public async Task<ActionResult<TenantDto>> PatchPlan(Guid id, [FromBody] PatchTenantPlanRequest request, CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var tenant = await db.Tenants.FindAsync([id], ct);
        if (tenant is null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Plan))
            tenant.Plan = DtoMappers.NormalizePlan(request.Plan);

        if (request.ExtraBrokerSlots is not null)
        {
            if (tenant.Type == TenantType.Independent)
                return BadRequest(new { message = "Corretor independente não possui assentos extras." });
            tenant.ExtraBrokerSlots = Math.Max(0, request.ExtraBrokerSlots.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
            tenant.Status = EnumMapper.ParseTenantStatus(request.Status);

        await db.SaveChangesAsync(ct);
        return Ok(DtoMappers.ToDto(tenant));
    }

    [HttpGet("me/theme")]
    public async Task<ActionResult<ThemeResponse>> GetTheme(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var tenant = await db.Tenants.FindAsync([tenantId.Value], ct);
        if (tenant is null)
            return NotFound();

        return Ok(new ThemeResponse(tenant.ThemeKey));
    }

    [HttpPut("me/theme")]
    public async Task<ActionResult<ThemeResponse>> UpdateTheme([FromBody] UpdateThemeRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var role = User.GetRole();
        if (role is not ("agency_admin" or "independent_broker"))
            return Forbid();

        var tenant = await db.Tenants.FindAsync([tenantId.Value], ct);
        if (tenant is null)
            return NotFound();

        tenant.ThemeKey = request.ThemeKey;
        await db.SaveChangesAsync(ct);
        return Ok(new ThemeResponse(tenant.ThemeKey));
    }
}
