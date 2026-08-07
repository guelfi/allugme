using System.Globalization;
using System.Security.Cryptography;
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
    IOptions<AppPublicOptions> appPublicOptions,
    IQrCodeGenerator qrCodeGenerator,
    IEmailSender emailSender,
    IEmailTemplateRenderer emailTemplates,
    IFileStorage storage,
    ILogger<AuthController> logger) : ControllerBase
{
    private const int TrialDays = 7;
    private const int PasswordResetMinutes = 60;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (!request.AcceptPrivacy)
            return BadRequest(new { message = "É necessário aceitar a Política de Privacidade (LGPD)." });

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
        var trialEndsAt = DateTime.UtcNow.AddDays(TrialDays);

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
            Status = TenantStatus.Trial,
            ThemeKey = "moderno",
            Plan = plan,
            IncludedBrokerSlots = isIndependent ? 1 : 5,
            ExtraBrokerSlots = 0,
            PixReferenceCode = pixReferenceCode,
            TrialEndsAt = trialEndsAt
        };
        db.Tenants.Add(tenant);
        db.TenantSettings.Add(new TenantSettings
        {
            TenantId = tenant.Id,
            BufferMinutes = 60,
            VisitDurationMinutes = 60,
            WhatsAppNotifyEnabled = false,
            EmailNotifyEnabled = true
        });

        var role = isIndependent ? MembershipRole.IndependentBroker : MembershipRole.AgencyAdmin;
        db.TenantMemberships.Add(new TenantMembership
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = tenant.Id,
            Role = role,
            Status = MembershipStatus.Active
        });

        db.ConsentRecords.Add(new ConsentRecord
        {
            Id = Guid.NewGuid(),
            Context = "register_b2b",
            PolicyVersion = "1.0",
            SubjectEmail = email,
            UserId = user.Id,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            AcceptedAt = DateTime.UtcNow
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

            await SendRegistrationEmailAsync(user, tenant.Name, planLabel, amount, pixReferenceCode, copyPaste, qrPng, trialEndsAt, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao gerar Pix/QR ou preparar e-mail para o cadastro de {Email}.", user.Email);
        }

        var token = jwt.GenerateToken(user.Id, user.Email, user.Name, false, tenant.Id, EnumMapper.ToApi(role));
        var memberships = await LoadMembershipsAsync(user.Id, ct);
        var userDto = await MapUserAsync(user, memberships, ct);

        return Ok(new
        {
            message =
                $"Cadastro concluído! Você já pode acessar o Allugme com {TrialDays} dias grátis. Pague via Pix quando quiser para manter o acesso depois do período de teste.",
            plan = planLabel,
            paymentMethod = "pix",
            tenant = new { tenant.Id, tenant.Name, tenant.Slug, status = "trial", trialEndsAt },
            nextStep = $"Seu período de teste termina em {trialEndsAt:dd/MM/yyyy}. Pague via Pix a qualquer momento para continuar usando o Allugme depois dessa data.",
            pix = pixInfo,
            accessToken = token,
            user = userDto,
            trialEndsAt
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
        DateTime trialEndsAt,
        CancellationToken ct)
    {
        try
        {
            var amountLabel = amount.ToString("N2", new CultureInfo("pt-BR"));
            var trialLabel = trialEndsAt.ToString("dd/MM/yyyy", new CultureInfo("pt-BR"));
            var html = $$"""
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
                  <h2 style="color: #0f766e;">Cadastro concluído — Allugme</h2>
                  <p>Olá, {{System.Net.WebUtility.HtmlEncode(user.Name)}}!</p>
                  <p>Recebemos o cadastro de <strong>{{System.Net.WebUtility.HtmlEncode(businessName)}}</strong>. Você já pode acessar o painel com <strong>7 dias grátis</strong>, válidos até <strong>{{trialLabel}}</strong>. Pague o Pix abaixo quando quiser para manter o acesso depois do período de teste.</p>
                  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding:4px 0; color:#6b7280;">Plano</td><td style="padding:4px 0; text-align:right;"><strong>{{System.Net.WebUtility.HtmlEncode(planLabel)}}</strong></td></tr>
                    <tr><td style="padding:4px 0; color:#6b7280;">Valor</td><td style="padding:4px 0; text-align:right;"><strong>R$ {{amountLabel}}</strong></td></tr>
                    <tr><td style="padding:4px 0; color:#6b7280;">Referência</td><td style="padding:4px 0; text-align:right;"><strong>{{txId}}</strong></td></tr>
                  </table>
                  <p style="text-align:center;"><img src="cid:pixqrcode" alt="QR Code Pix" style="width:220px;height:220px;" /></p>
                  <p>Pix copia e cola:</p>
                  <p style="word-break: break-all; background:#f3f4f6; padding:10px; border-radius:8px; font-family: monospace; font-size: 12px;">{{copyPaste}}</p>
                  <p style="color:#6b7280; font-size: 13px;">Após {{trialLabel}}, o acesso fica pausado até a confirmação do pagamento. Qualquer dúvida, é só responder este e-mail.</p>
                </div>
                """;

            await emailSender.SendAsync(
                user.Email,
                "Allugme — Cadastro concluído, 7 dias grátis para testar",
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
        if (memberships.Any(m => m.Status == MembershipStatus.Invited) &&
            memberships.All(m => m.Status == MembershipStatus.Invited) &&
            !user.IsClient && !user.IsSaasAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Finalize o convite pelo link enviado ao seu e-mail antes de entrar."
            });
        }

        Guid? tenantId = request.TenantId;
        string? role = null;

        if (user.IsClient && memberships.Count == 0)
        {
            var clientToken = jwt.GenerateToken(user.Id, user.Email, user.Name, false, null, "client", isClient: true);
            return Ok(new AuthResponse(clientToken, await MapUserAsync(user, memberships, ct)));
        }

        if (tenantId.HasValue)
        {
            var membership = memberships.FirstOrDefault(m => m.TenantId == tenantId && m.Status == MembershipStatus.Active);
            if (membership is null && !user.IsSaasAdmin)
                return Forbid();
            role = membership is not null ? EnumMapper.ToApi(membership.Role) : null;
        }
        else if (memberships.Count(m => m.Status == MembershipStatus.Active) == 1)
        {
            var m = memberships.First(x => x.Status == MembershipStatus.Active);
            tenantId = m.TenantId;
            role = EnumMapper.ToApi(m.Role);
        }

        if (!user.IsSaasAdmin && tenantId.HasValue)
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
            if (tenant?.Status == TenantStatus.Trial
                && tenant.TrialEndsAt.HasValue
                && tenant.TrialEndsAt.Value < DateTime.UtcNow)
            {
                tenant.Status = TenantStatus.PendingPayment;
                await db.SaveChangesAsync(ct);
            }

            if (tenant?.Status == TenantStatus.PendingPayment)
                return StatusCode(StatusCodes.Status402PaymentRequired, new
                {
                    message = tenant.TrialEndsAt.HasValue
                        ? "Seu período de teste gratuito de 7 dias terminou. Realize o pagamento via Pix para continuar usando o Allugme."
                        : "Conta aguardando confirmação de pagamento Pix pelo administrador."
                });
            if (tenant?.Status == TenantStatus.Suspended)
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Conta suspensa. Fale com o suporte Allugme."
                });
        }

        var token = jwt.GenerateToken(user.Id, user.Email, user.Name, user.IsSaasAdmin, tenantId, role, user.IsClient);
        return Ok(new AuthResponse(token, await MapUserAsync(user, memberships, ct)));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout() => Ok(new { message = "Logout realizado." });

    /// <summary>
    /// Solicita e-mail de redefinição de senha. Sempre retorna 200 para não vazar existência de conta.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var generic = new
        {
            message = "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha."
        };

        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return Ok(generic);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null)
            return Ok(generic);

        var membership = await db.TenantMemberships
            .Include(m => m.Tenant)
            .Where(m => m.UserId == user.Id)
            .OrderBy(m => m.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var tenant = membership?.Tenant;
        var themeKey = tenant?.ThemeKey ?? "moderno";
        var brandName = tenant?.Name ?? "Allugme";

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var tokenHash = HashToken(rawToken);

        var now = DateTime.UtcNow;
        var existing = await db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > now)
            .ToListAsync(ct);
        foreach (var old in existing)
            old.UsedAt = now;

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = now.AddMinutes(PasswordResetMinutes),
            CreatedAt = now
        });
        await db.SaveChangesAsync(ct);

        var baseUrl = appPublicOptions.Value.DashboardBaseUrl.TrimEnd('/');
        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        try
        {
            var html = await emailTemplates.RenderAsync(
                EmailTemplateKeys.PasswordReset,
                themeKey,
                tenant?.Id,
                new Dictionary<string, string>
                {
                    ["user_name"] = user.Name,
                    ["user_email"] = user.Email,
                    ["brand_name"] = brandName,
                    ["expires_minutes"] = PasswordResetMinutes.ToString(),
                    ["reset_url"] = resetUrl
                },
                ct);

            await emailSender.SendAsync(
                user.Email,
                $"{brandName} — Redefinir senha",
                html,
                ct: ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao enviar e-mail de reset de senha para {Email}.", user.Email);
        }

        return Ok(generic);
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        var token = (request.Token ?? string.Empty).Trim();
        var newPassword = request.NewPassword ?? string.Empty;
        if (string.IsNullOrWhiteSpace(token) || newPassword.Length < 8)
            return BadRequest(new { message = "Token inválido ou senha muito curta (mínimo 8 caracteres)." });

        var hash = HashToken(token);
        var now = DateTime.UtcNow;
        var reset = await db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (reset is null || reset.UsedAt is not null || reset.ExpiresAt < now)
            return BadRequest(new { message = "Link inválido ou expirado. Solicite uma nova redefinição." });

        reset.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        reset.UsedAt = now;
        await db.SaveChangesAsync(ct);

        return Ok(new { message = "Senha atualizada. Você já pode entrar no painel." });
    }

    [HttpPost("accept-invite")]
    [AllowAnonymous]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<AuthResponse>> AcceptInvite(
        [FromForm] string token,
        [FromForm] string password,
        [FromForm] string phone,
        IFormFile? avatar,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(password) || password.Length < 8)
            return BadRequest(new { message = "Token inválido ou senha muito curta (mínimo 8 caracteres)." });

        var phoneDigits = Regex.Replace(phone ?? string.Empty, @"\D", "");
        if (phoneDigits.Length < 10)
            return BadRequest(new { message = "Informe um WhatsApp/celular válido, com DDD." });

        if (avatar is null || avatar.Length == 0)
            return BadRequest(new { message = "A foto de perfil é obrigatória para corretores." });

        var hash = HashToken(token.Trim());
        var now = DateTime.UtcNow;
        var invite = await db.BrokerInviteTokens
            .Include(t => t.User)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (invite is null || invite.UsedAt is not null || invite.ExpiresAt < now)
            return BadRequest(new { message = "Convite inválido ou expirado." });

        var membership = await db.TenantMemberships
            .FirstOrDefaultAsync(m => m.UserId == invite.UserId && m.TenantId == invite.TenantId, ct);
        if (membership is null || membership.Status != MembershipStatus.Invited)
            return BadRequest(new { message = "Convite já utilizado ou inválido." });

        var phoneE164 = phoneDigits.StartsWith("55") ? $"+{phoneDigits}" : $"+55{phoneDigits}";
        invite.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        invite.User.Phone = phoneE164;

        await using (var stream = avatar.OpenReadStream())
        {
            invite.User.AvatarPath = await storage.SaveAsync(stream, avatar.FileName, avatar.ContentType, ct);
        }

        membership.Status = MembershipStatus.Active;
        invite.UsedAt = now;
        await db.SaveChangesAsync(ct);

        var jwtToken = jwt.GenerateToken(
            invite.User.Id, invite.User.Email, invite.User.Name, false,
            invite.TenantId, EnumMapper.ToApi(membership.Role));
        var memberships = await LoadMembershipsAsync(invite.User.Id, ct);
        return Ok(new AuthResponse(jwtToken, await MapUserAsync(invite.User, memberships, ct)));
    }

    [HttpPost("register-client")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> RegisterClient([FromBody] RegisterClientRequest request, CancellationToken ct)
    {
        if (!request.AcceptPrivacy)
            return BadRequest(new { message = "É necessário aceitar a Política de Privacidade (LGPD)." });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "E-mail já cadastrado." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return BadRequest(new { message = "Senha deve ter ao menos 8 caracteres." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = request.Name.Trim(),
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsClient = true
        };
        db.Users.Add(user);
        db.ConsentRecords.Add(new ConsentRecord
        {
            Id = Guid.NewGuid(),
            Context = "register_client",
            PolicyVersion = "1.0",
            SubjectEmail = email,
            UserId = user.Id,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            AcceptedAt = DateTime.UtcNow
        });

        // Vincula visitas anteriores pelo mesmo e-mail
        var orphanVisits = await db.Visits
            .Where(v => v.ClientUserId == null && v.VisitorEmail != null && v.VisitorEmail.ToLower() == email)
            .ToListAsync(ct);
        foreach (var v in orphanVisits)
            v.ClientUserId = user.Id;

        await db.SaveChangesAsync(ct);

        var token = jwt.GenerateToken(user.Id, user.Email, user.Name, false, null, "client", isClient: true);
        return Ok(new AuthResponse(token, await MapUserAsync(user, [], ct)));
    }

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

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
            user.IsClient,
            string.IsNullOrEmpty(user.AvatarPath) ? null : storage.GetPublicUrl(user.AvatarPath),
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
