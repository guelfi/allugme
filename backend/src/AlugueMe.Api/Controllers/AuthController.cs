using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Auth;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Payments;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
    AppDbContext db,
    IJwtTokenService jwt,
    IOptions<PixOptions> pixOptions,
    IQrCodeGenerator qrCodeGenerator,
    IEmailSender emailSender,
    ILogger<AuthController> logger) : ControllerBase
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

        var phoneDigits = Regex.Replace(request.Phone ?? string.Empty, @"\D", "");
        if (phoneDigits.Length < 10)
            return BadRequest(new { message = "Informe um WhatsApp/celular válido, com DDD." });

        var accountType = (request.AccountType ?? "agency").Trim().ToLowerInvariant();
        var isIndependent = PlanCatalog.IsIndependent(accountType);
        var plan = DtoMappers.NormalizePlan(request.Plan);
        var planLabel = PlanCatalog.GetLabel(accountType, plan);
        var amount = PlanCatalog.GetAmount(accountType, plan);
        var phoneE164 = phoneDigits.StartsWith("55") ? $"+{phoneDigits}" : $"+55{phoneDigits}";
        var pixReferenceCode = string.IsNullOrWhiteSpace(request.PixReferenceCode)
            ? PixReferenceGenerator.Generate()
            : request.PixReferenceCode.Trim().ToUpperInvariant();

        var slug = await UniqueSlugAsync(request.BusinessName, ct);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = request.Name,
            Phone = phoneE164,
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
            ThemeKey = "moderno",
            Plan = plan,
            IncludedBrokerSlots = isIndependent ? 1 : 5,
            ExtraBrokerSlots = 0,
            PixReferenceCode = pixReferenceCode
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

        object? pixInfo = null;
        try
        {
            var pix = pixOptions.Value;
            var copyPaste = PixBrCodeBuilder.Build(pix.Key, pix.MerchantName, pix.MerchantCity, amount, pixReferenceCode);
            var qrPng = qrCodeGenerator.GeneratePng(copyPaste);
            pixInfo = new
            {
                amount,
                pixKey = pix.Key,
                merchantName = pix.MerchantName,
                merchantCity = pix.MerchantCity,
                txId = pixReferenceCode,
                copyPaste,
                qrCodePngBase64 = Convert.ToBase64String(qrPng)
            };

            await SendRegistrationEmailAsync(user, tenant.Name, planLabel, amount, pixReferenceCode, copyPaste, qrPng, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao gerar Pix/QR ou preparar e-mail para o cadastro de {Email}.", user.Email);
        }

        return Ok(new
        {
            message =
                "Cadastro recebido. Realize o pagamento via Pix e aguarde a liberação pelo administrador do Allugme para acessar o painel.",
            plan = planLabel,
            paymentMethod = "pix",
            tenant = new { tenant.Id, tenant.Name, tenant.Slug, status = "pending_payment" },
            nextStep = "Após o Pix, o administrador ativa sua conta. Você receberá confirmação no e-mail cadastrado.",
            pix = pixInfo
        });
    }

    private async Task SendRegistrationEmailAsync(
        User user,
        string businessName,
        string planLabel,
        decimal amount,
        string txId,
        string copyPaste,
        byte[] qrPng,
        CancellationToken ct)
    {
        try
        {
            var amountLabel = amount.ToString("N2", new CultureInfo("pt-BR"));
            var html = $$"""
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
                  <h2 style="color: #0f766e;">Cadastro recebido — Allugme</h2>
                  <p>Olá, {{System.Net.WebUtility.HtmlEncode(user.Name)}}!</p>
                  <p>Recebemos o cadastro de <strong>{{System.Net.WebUtility.HtmlEncode(businessName)}}</strong>. Para ativar sua conta, realize o pagamento via Pix abaixo. Assim que confirmado pelo administrador Allugme, o acesso é liberado.</p>
                  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding:4px 0; color:#6b7280;">Plano</td><td style="padding:4px 0; text-align:right;"><strong>{{System.Net.WebUtility.HtmlEncode(planLabel)}}</strong></td></tr>
                    <tr><td style="padding:4px 0; color:#6b7280;">Valor</td><td style="padding:4px 0; text-align:right;"><strong>R$ {{amountLabel}}</strong></td></tr>
                    <tr><td style="padding:4px 0; color:#6b7280;">Referência</td><td style="padding:4px 0; text-align:right;"><strong>{{txId}}</strong></td></tr>
                  </table>
                  <p style="text-align:center;"><img src="cid:pixqrcode" alt="QR Code Pix" style="width:220px;height:220px;" /></p>
                  <p>Pix copia e cola:</p>
                  <p style="word-break: break-all; background:#f3f4f6; padding:10px; border-radius:8px; font-family: monospace; font-size: 12px;">{{copyPaste}}</p>
                  <p style="color:#6b7280; font-size: 13px;">Após o pagamento, aguarde a liberação pelo administrador do Allugme. Você receberá acesso no e-mail cadastrado.</p>
                </div>
                """;

            await emailSender.SendAsync(
                user.Email,
                "Allugme — Cadastro recebido, finalize com o Pix",
                html,
                [new EmailAttachment("pix-qrcode.png", qrPng, "image/png", "pixqrcode")],
                ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao preparar/enviar e-mail de cadastro para {Email}.", user.Email);
        }
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
        return Ok(new AuthResponse(token, await MapUserAsync(user, memberships, ct)));
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
        return Ok(await MapUserAsync(user, memberships, ct));
    }

    private async Task<List<TenantMembership>> LoadMembershipsAsync(Guid userId, CancellationToken ct) =>
        await db.TenantMemberships
            .Include(m => m.Tenant)
            .Where(m => m.UserId == userId)
            .ToListAsync(ct);

    private async Task<UserDto> MapUserAsync(User user, List<TenantMembership> memberships, CancellationToken ct)
    {
        var tenantIds = memberships.Select(m => m.TenantId).Distinct().ToList();
        var usage = await db.TenantMemberships
            .Where(m => tenantIds.Contains(m.TenantId))
            .GroupBy(m => m.TenantId)
            .Select(g => new { TenantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Count, ct);

        return new UserDto(
            user.Id,
            user.Email,
            user.Name,
            user.Phone,
            user.IsSaasAdmin,
            memberships.Select(m => DtoMappers.ToDto(m, usage.GetValueOrDefault(m.TenantId))).ToList());
    }

    private async Task<string> UniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = Slugify(name);
        if (ReservedTenantSlugs.IsReserved(baseSlug))
            baseSlug = $"imob-{baseSlug}";

        var slug = baseSlug;
        var i = 2;
        while (ReservedTenantSlugs.IsReserved(slug) || await db.Tenants.AnyAsync(t => t.Slug == slug, ct))
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
