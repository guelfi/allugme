using AlugueMe.Api.Auth;
using AlugueMe.Application.Dtos.Settings;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
[Authorize]
public class SettingsController(AppDbContext db, IWhatsAppQueue whatsAppQueue) : ControllerBase
{
    [HttpGet("tenant")]
    public async Task<ActionResult<TenantSettingsDto>> GetTenantSettings(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var settings = await db.TenantSettings.FindAsync([tenantId.Value], ct);
        if (settings is null)
            return NotFound();

        return Ok(MapTenant(settings));
    }

    [HttpPut("tenant")]
    public async Task<ActionResult<TenantSettingsDto>> UpdateTenantSettings([FromBody] UpdateTenantSettingsRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var role = User.GetRole();
        if (role is not ("agency_admin" or "independent_broker"))
            return Forbid();

        var settings = await db.TenantSettings.FindAsync([tenantId.Value], ct);
        if (settings is null)
        {
            settings = new TenantSettings { TenantId = tenantId.Value };
            db.TenantSettings.Add(settings);
        }

        if (request.BufferMinutes is not null) settings.BufferMinutes = request.BufferMinutes.Value;
        if (request.VisitDurationMinutes is not null) settings.VisitDurationMinutes = request.VisitDurationMinutes.Value;
        if (request.WhatsAppE164 is not null) settings.WhatsAppE164 = request.WhatsAppE164;
        if (request.EvolutionInstanceName is not null) settings.EvolutionInstanceName = request.EvolutionInstanceName;
        if (request.WhatsAppNotifyEnabled is not null) settings.WhatsAppNotifyEnabled = request.WhatsAppNotifyEnabled.Value;
        if (request.EmailNotifyEnabled is not null) settings.EmailNotifyEnabled = request.EmailNotifyEnabled.Value;

        await db.SaveChangesAsync(ct);
        return Ok(MapTenant(settings));
    }

    [HttpGet("broker")]
    public async Task<ActionResult<BrokerSettingsDto>> GetBrokerSettings(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var settings = await db.BrokerSettings.FirstOrDefaultAsync(b => b.UserId == User.GetUserId() && b.TenantId == tenantId, ct);
        return Ok(MapBroker(settings));
    }

    [HttpPut("broker")]
    public async Task<ActionResult<BrokerSettingsDto>> UpdateBrokerSettings([FromBody] UpdateBrokerSettingsRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var settings = await db.BrokerSettings.FirstOrDefaultAsync(b => b.UserId == User.GetUserId() && b.TenantId == tenantId, ct);
        if (settings is null)
        {
            settings = new BrokerSettings
            {
                Id = Guid.NewGuid(),
                UserId = User.GetUserId(),
                TenantId = tenantId.Value
            };
            db.BrokerSettings.Add(settings);
        }

        if (request.BufferMinutes is not null) settings.BufferMinutes = request.BufferMinutes;
        if (request.VisitDurationMinutes is not null) settings.VisitDurationMinutes = request.VisitDurationMinutes;
        if (request.WhatsAppE164 is not null) settings.WhatsAppE164 = request.WhatsAppE164;
        if (request.WhatsAppNotifyEnabled is not null) settings.WhatsAppNotifyEnabled = request.WhatsAppNotifyEnabled;

        await db.SaveChangesAsync(ct);
        return Ok(MapBroker(settings));
    }

    [HttpGet("availability")]
    public async Task<ActionResult<AvailabilityRulesResponse>> GetAvailability([FromQuery] string scope = "tenant", CancellationToken ct = default)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        Guid? brokerId = scope == "broker" ? User.GetUserId() : null;
        var rules = await db.AvailabilityRules
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId && r.BrokerUserId == brokerId)
            .OrderBy(r => r.DayOfWeek)
            .ToListAsync(ct);

        if (rules.Count == 0)
            return Ok(new AvailabilityRulesResponse(DefaultWeekRules()));

        return Ok(new AvailabilityRulesResponse(rules.Select(MapRule).ToList()));
    }

    [HttpPut("availability")]
    public async Task<ActionResult<AvailabilityRulesResponse>> UpdateAvailability(
        [FromBody] UpdateAvailabilityRulesRequest request,
        [FromQuery] string scope = "tenant",
        CancellationToken ct = default)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var role = User.GetRole();
        Guid? brokerId = null;
        if (scope == "broker")
        {
            brokerId = User.GetUserId();
        }
        else if (role is not ("agency_admin" or "independent_broker"))
        {
            return Forbid();
        }

        var existing = await db.AvailabilityRules
            .Where(r => r.TenantId == tenantId && r.BrokerUserId == brokerId)
            .ToListAsync(ct);
        db.AvailabilityRules.RemoveRange(existing);

        foreach (var dto in request.Rules)
        {
            if (!TimeOnly.TryParse(dto.StartTime, out var start))
                start = new TimeOnly(9, 0);
            if (!TimeOnly.TryParse(dto.EndTime, out var end))
                end = new TimeOnly(18, 0);

            db.AvailabilityRules.Add(new AvailabilityRule
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                BrokerUserId = brokerId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = start,
                EndTime = end,
                IsClosed = dto.IsClosed
            });
        }

        await db.SaveChangesAsync(ct);
        var saved = await db.AvailabilityRules
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId && r.BrokerUserId == brokerId)
            .OrderBy(r => r.DayOfWeek)
            .ToListAsync(ct);
        return Ok(new AvailabilityRulesResponse(saved.Select(MapRule).ToList()));
    }

    [HttpPost("whatsapp/test")]
    public async Task<IActionResult> TestWhatsApp([FromBody] WhatsAppTestRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var tenantSettings = await db.TenantSettings.FindAsync([tenantId.Value], ct);
        if (string.IsNullOrWhiteSpace(tenantSettings?.EvolutionInstanceName))
            return BadRequest(new { message = "Evolution instance não configurada." });

        if (string.IsNullOrWhiteSpace(request.ToE164))
            return BadRequest(new { message = "Número de destino não informado." });

        var text = request.Message ?? "Mensagem de teste Allugme";
        await whatsAppQueue.EnqueueAsync(new WhatsAppQueueMessage(
            tenantId, null, tenantSettings.EvolutionInstanceName, request.ToE164.Trim(), text), ct);

        return Ok(new { message = "Mensagem enfileirada." });
    }

    private static TenantSettingsDto MapTenant(TenantSettings s) =>
        new(s.BufferMinutes, s.VisitDurationMinutes, s.WhatsAppE164, s.EvolutionInstanceName, s.WhatsAppNotifyEnabled, s.EmailNotifyEnabled);

    private static BrokerSettingsDto MapBroker(BrokerSettings? s) =>
        new(s?.BufferMinutes, s?.VisitDurationMinutes, s?.WhatsAppE164, s?.WhatsAppNotifyEnabled);

    private static AvailabilityRuleDto MapRule(AvailabilityRule r) =>
        new(r.DayOfWeek, r.StartTime.ToString("HH:mm"), r.EndTime.ToString("HH:mm"), r.IsClosed);

    private static List<AvailabilityRuleDto> DefaultWeekRules() =>
    [
        new(0, "09:00", "18:00", true),
        new(1, "09:00", "18:00", false),
        new(2, "09:00", "18:00", false),
        new(3, "09:00", "18:00", false),
        new(4, "09:00", "18:00", false),
        new(5, "09:00", "18:00", false),
        new(6, "09:00", "18:00", true)
    ];
}
