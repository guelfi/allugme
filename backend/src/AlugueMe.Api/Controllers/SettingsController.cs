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

    [HttpPost("whatsapp/test")]
    public async Task<IActionResult> TestWhatsApp([FromBody] WhatsAppTestRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var tenantSettings = await db.TenantSettings.FindAsync([tenantId.Value], ct);
        if (tenantSettings?.EvolutionInstanceName is null)
            return BadRequest(new { message = "Evolution instance não configurada." });

        var text = request.Message ?? "Mensagem de teste Allugme";
        await whatsAppQueue.EnqueueAsync(new WhatsAppQueueMessage(
            tenantId, null, tenantSettings.EvolutionInstanceName, request.ToE164, text), ct);

        return Ok(new { message = "Mensagem enfileirada." });
    }

    private static TenantSettingsDto MapTenant(TenantSettings s) =>
        new(s.BufferMinutes, s.VisitDurationMinutes, s.WhatsAppE164, s.EvolutionInstanceName, s.WhatsAppNotifyEnabled);

    private static BrokerSettingsDto MapBroker(BrokerSettings? s) =>
        new(s?.BufferMinutes, s?.VisitDurationMinutes, s?.WhatsAppE164, s?.WhatsAppNotifyEnabled);
}
