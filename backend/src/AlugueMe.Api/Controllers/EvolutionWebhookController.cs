using AlugueMe.Application.Common;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Visits;
using AlugueMe.Application.WhatsApp;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Evolution;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/webhooks/evolution")]
[AllowAnonymous]
public class EvolutionWebhookController(
    AppDbContext db,
    IOptions<EvolutionOptions> evolutionOptions,
    IWebhookIdempotencyStore idempotency,
    IRedisLockService lockService,
    IWhatsAppQueue whatsAppQueue,
    Infrastructure.Email.TransactionalEmailService emails) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Handle([FromBody] EvolutionWebhookPayload payload, CancellationToken ct)
    {
        var secret = Request.Headers["X-Webhook-Secret"].FirstOrDefault()
            ?? Request.Headers["apikey"].FirstOrDefault();

        if (!string.IsNullOrEmpty(evolutionOptions.Value.WebhookSecret) &&
            !string.Equals(secret, evolutionOptions.Value.WebhookSecret, StringComparison.Ordinal))
            return Unauthorized();

        var messageId = payload.Data?.Key?.Id;
        if (!string.IsNullOrEmpty(messageId))
        {
            if (!await idempotency.TryMarkProcessedAsync(messageId, TimeSpan.FromHours(24), ct))
                return Ok(new { message = "duplicate" });
        }

        var text = EvolutionPhoneHelper.ExtractText(payload);
        var parsed = WhatsAppReplyParser.TryParse(text);
        if (parsed is null)
            return Ok(new { message = "ignored" });

        var sender = EvolutionPhoneHelper.ExtractE164(payload.Data?.Key?.RemoteJid);
        if (sender is null)
            return Ok(new { message = "no sender" });

        var visit = await db.Visits
            .Include(v => v.Property)
            .Include(v => v.Broker)
            .Include(v => v.Tenant)
            .FirstOrDefaultAsync(v => v.ConfirmationCode == parsed.ConfirmationCode && v.Status == VisitStatus.Pending, ct);

        if (visit is null)
            return Ok(new { message = "visit not found" });

        if (!await IsAuthorizedSenderAsync(visit, sender, ct))
            return Ok(new { message = "unauthorized sender" });

        await using var redisLock = await lockService.AcquireLockAsync($"visit:broker:{visit.BrokerId}", TimeSpan.FromSeconds(30), ct);
        if (redisLock is null)
            return Conflict();

        var newStatus = parsed.Action == WhatsAppReplyAction.Confirm ? VisitStatus.Confirmed : VisitStatus.Rejected;

        if (newStatus == VisitStatus.Confirmed)
        {
            var hasConflict = await db.Visits.AnyAsync(v =>
                v.Id != visit.Id &&
                v.BrokerId == visit.BrokerId &&
                (v.Status == VisitStatus.Pending || v.Status == VisitStatus.Confirmed) &&
                visit.StartAt < v.EndAt.AddMinutes(v.BufferMinutesApplied) &&
                visit.EndAt.AddMinutes(visit.BufferMinutesApplied) > v.StartAt, ct);

            if (hasConflict)
                return Ok(new { message = "conflict" });
        }

        visit.Status = newStatus;
        visit.ConfirmedVia = ConfirmedVia.WhatsApp;
        await db.SaveChangesAsync(ct);

        var tenantSettings = await db.TenantSettings.FindAsync([visit.TenantId], ct);
        if (!string.IsNullOrWhiteSpace(visit.VisitorPhone) && tenantSettings?.EvolutionInstanceName is not null)
        {
            var msg = newStatus == VisitStatus.Confirmed
                ? $"Sua visita ao imóvel {visit.Property.Title} foi confirmada!"
                : $"Sua visita ao imóvel {visit.Property.Title} foi recusada.";

            await whatsAppQueue.EnqueueAsync(new WhatsAppQueueMessage(
                visit.TenantId, visit.Id, tenantSettings.EvolutionInstanceName, visit.VisitorPhone, msg), ct);
        }

        await emails.SendVisitStatusToVisitorAsync(
            visit, visit.Property, visit.Tenant, tenantSettings?.EmailNotifyEnabled ?? true, ct);

        return Ok(new { message = "processed", status = EnumMapper.ToApi(newStatus) });
    }

    private async Task<bool> IsAuthorizedSenderAsync(Domain.Entities.Visit visit, string sender, CancellationToken ct)
    {
        var brokerSettings = await db.BrokerSettings.FirstOrDefaultAsync(b => b.UserId == visit.BrokerId && b.TenantId == visit.TenantId, ct);
        if (!string.IsNullOrWhiteSpace(brokerSettings?.WhatsAppE164) &&
            NormalizePhone(brokerSettings.WhatsAppE164) == NormalizePhone(sender))
            return true;

        var tenantSettings = await db.TenantSettings.FindAsync([visit.TenantId], ct);
        if (!string.IsNullOrWhiteSpace(tenantSettings?.WhatsAppE164) &&
            NormalizePhone(tenantSettings.WhatsAppE164) == NormalizePhone(sender))
            return true;

        return false;
    }

    private static string NormalizePhone(string phone) =>
        new(phone.Where(char.IsDigit).ToArray());
}
