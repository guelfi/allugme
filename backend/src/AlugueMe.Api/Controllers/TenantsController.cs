using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Payments;
using AlugueMe.Application.Dtos.Tenants;
using AlugueMe.Application.Dtos.Themes;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Payments;
using AlugueMe.Application.Themes;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/tenants")]
[Authorize]
public class TenantsController(
    AppDbContext db,
    IOptions<PixOptions> pixOptions,
    IQrCodeGenerator qrCodeGenerator,
    ICustomThemePackage customThemes) : ControllerBase
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

    [HttpGet("me/pix")]
    public async Task<ActionResult<PixQuoteResponse>> GetMyPix(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null || User.IsSaasAdmin())
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var tenant = await db.Tenants.FindAsync([tenantId.Value], ct);
        if (tenant is null)
            return NotFound();

        var accountType = tenant.Type == TenantType.Independent ? "independent" : "agency";
        var plan = DtoMappers.NormalizePlan(tenant.Plan);
        var amount = PlanCatalog.GetAmount(accountType, plan);
        var planLabel = PlanCatalog.GetLabel(accountType, plan);
        var txId = string.IsNullOrWhiteSpace(tenant.PixReferenceCode)
            ? PixReferenceGenerator.Generate()
            : tenant.PixReferenceCode;

        var pix = pixOptions.Value;
        var copyPaste = PixBrCodeBuilder.Build(pix.Key, pix.MerchantName, pix.MerchantCity, amount, txId);
        var qrPng = qrCodeGenerator.GeneratePng(copyPaste);

        return Ok(new PixQuoteResponse(
            amount, planLabel, pix.Key, pix.MerchantName, pix.MerchantCity, txId, copyPaste,
            Convert.ToBase64String(qrPng)));
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

        return Ok(await ThemePayloadAsync(tenant, ct));
    }

    [HttpGet("me/theme/model")]
    public ActionResult<ThemeModelResponse> GetThemeModel()
    {
        return Ok(new ThemeModelResponse(
            OfficialThemeCatalog.Keys,
            ThemeModelRules.RequiredFiles,
            ThemeModelRules.RequiredPages,
            [
                "tenant.name", "tenant.logo_url", "tenant.phone",
                "property.id", "property.title", "property.price", "property.city",
                "property.neighborhood", "property.bedrooms", "property.operation",
                "property.images", "property.description", "properties",
                "search.filters", "visit.slots_endpoint", "visit.submit_endpoint",
                "api.base", "app.dashboard_url"
            ],
            "O ZIP precisa seguir o modelo oficial. A vitrine só usa o layout após validação no painel administrativo da Allugme."));
    }

    [HttpPost("me/theme/submissions")]
    [RequestSizeLimit(ThemeModelRules.MaxPackageBytes)]
    public async Task<ActionResult<CustomThemeSubmissionDto>> SubmitCustomTheme(IFormFile? package, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var role = User.GetRole();
        if (role is not ("agency_admin" or "independent_broker"))
            return Forbid();

        if (package is null || package.Length == 0)
            return BadRequest(new { message = "Envie um ZIP do layout no modelo publicado." });
        if (package.Length > ThemeModelRules.MaxPackageBytes)
            return BadRequest(new { message = "O pacote excede 8 MB." });

        var tenant = await db.Tenants.FindAsync([tenantId.Value], ct);
        if (tenant is null)
            return NotFound();

        var maxVersion = await db.CustomThemeSubmissions
            .Where(s => s.TenantId == tenant.Id)
            .Select(s => (int?)s.Version)
            .MaxAsync(ct);
        var nextVersion = (maxVersion ?? 0) + 1;

        var submission = new CustomThemeSubmission
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Version = nextVersion,
            OriginalFileName = Path.GetFileName(package.FileName)
        };

        await using var stream = package.OpenReadStream();
        var stored = await customThemes.StorePendingAsync(
            tenant.Id, submission.Id, nextVersion, submission.OriginalFileName, stream, ct);
        if (!stored.IsValid)
            return BadRequest(new { message = string.Join(" ", stored.Errors) });

        submission.StorageFolder = stored.StorageFolder;
        db.CustomThemeSubmissions.Add(submission);
        await db.SaveChangesAsync(ct);

        return Ok(ToDto(submission, tenant.Name));
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

        var themeKey = request.ResolvedKey;
        CustomThemeSubmission? submission = null;
        if (OfficialThemeCatalog.TryParseCustomKey(themeKey, out var submissionId))
        {
            submission = await db.CustomThemeSubmissions.FirstOrDefaultAsync(s => s.Id == submissionId, ct);
        }

        if (!ThemeActivation.CanActivate(themeKey, submission, tenant.Id))
            return BadRequest(new { message = "Só é possível ativar um tema oficial ou um layout próprio já aprovado pelo administrador." });

        tenant.ThemeKey = OfficialThemeCatalog.IsOfficial(themeKey)
            ? themeKey.Trim().ToLowerInvariant()
            : themeKey.Trim();
        await db.SaveChangesAsync(ct);
        return Ok(await ThemePayloadAsync(tenant, ct));
    }

    private async Task<ThemeResponse> ThemePayloadAsync(Tenant tenant, CancellationToken ct)
    {
        var submissions = await db.CustomThemeSubmissions
            .Where(s => s.TenantId == tenant.Id)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync(ct);

        return new ThemeResponse(
            tenant.ThemeKey,
            tenant.ThemeKey,
            submissions.Select(s => ToDto(s, tenant.Name)).ToList());
    }

    private static CustomThemeSubmissionDto ToDto(CustomThemeSubmission submission, string tenantName) =>
        new(
            submission.Id,
            submission.TenantId,
            tenantName,
            submission.Version,
            submission.Status.ToString().ToLowerInvariant(),
            submission.ThemeKey,
            submission.OriginalFileName,
            submission.ReviewNotes,
            submission.SubmittedAt,
            submission.ReviewedAt);
}
