using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Visits;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Email;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/visits")]
[Authorize]
public class VisitsController(
    AppDbContext db,
    IRedisLockService lockService,
    IWhatsAppQueue whatsAppQueue,
    TransactionalEmailService emails) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VisitDto>>> List(
        [FromQuery] Guid? brokerId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null && !User.IsSaasAdmin())
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var query = db.Visits
            .Include(v => v.Property)
            .Include(v => v.Broker)
            .AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(v => v.TenantId == tenantId);

        var role = User.GetRole();
        if (role == "broker" && !User.IsSaasAdmin())
            query = query.Where(v => v.BrokerId == User.GetUserId());
        else if (brokerId.HasValue)
            query = query.Where(v => v.BrokerId == brokerId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == EnumMapper.ParseVisitStatus(status));

        var items = await query.OrderBy(v => v.StartAt).ToListAsync(ct);
        return Ok(items.Select(DtoMappers.ToDto));
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<VisitDto>> PatchStatus(Guid id, [FromBody] PatchVisitRequest request, CancellationToken ct)
    {
        var visit = await db.Visits
            .Include(v => v.Property)
            .Include(v => v.Broker)
            .Include(v => v.Tenant)
            .FirstOrDefaultAsync(v => v.Id == id, ct);

        if (visit is null)
            return NotFound();

        if (!CanManage(visit))
            return Forbid();

        var newStatus = EnumMapper.ParseVisitStatus(request.Status);
        if (newStatus is VisitStatus.Confirmed or VisitStatus.Rejected && visit.Status != VisitStatus.Pending)
            return BadRequest(new { message = "Visita não está pendente." });

        await using var redisLock = await lockService.AcquireLockAsync($"visit:broker:{visit.BrokerId}", TimeSpan.FromSeconds(30), ct);
        if (redisLock is null)
            return Conflict(new { message = "Agenda ocupada, tente novamente." });

        if (newStatus == VisitStatus.Confirmed)
        {
            var hasConflict = await db.Visits.AnyAsync(v =>
                v.Id != visit.Id &&
                v.BrokerId == visit.BrokerId &&
                (v.Status == VisitStatus.Pending || v.Status == VisitStatus.Confirmed) &&
                visit.StartAt < v.EndAt.AddMinutes(v.BufferMinutesApplied) &&
                visit.EndAt.AddMinutes(visit.BufferMinutesApplied) > v.StartAt, ct);

            if (hasConflict)
                return Conflict(new { message = "Conflito de agenda." });
        }

        visit.Status = newStatus;
        visit.ConfirmedVia = ConfirmedVia.Panel;
        await db.SaveChangesAsync(ct);

        await NotifyVisitorAsync(visit, ct);
        return Ok(DtoMappers.ToDto(visit));
    }

    private bool CanManage(Domain.Entities.Visit visit)
    {
        if (User.IsSaasAdmin() && User.GetRole() is null)
            return false;

        var tenantId = User.GetTenantId();
        if (tenantId != visit.TenantId)
            return false;

        var role = User.GetRole();
        return role is "agency_admin" or "independent_broker" || (role == "broker" && visit.BrokerId == User.GetUserId());
    }

    private async Task NotifyVisitorAsync(Domain.Entities.Visit visit, CancellationToken ct)
    {
        var tenantSettings = await db.TenantSettings.FindAsync([visit.TenantId], ct);

        if (!string.IsNullOrWhiteSpace(visit.VisitorPhone)
            && tenantSettings?.WhatsAppNotifyEnabled == true
            && !string.IsNullOrWhiteSpace(tenantSettings.EvolutionInstanceName))
        {
            var message = visit.Status switch
            {
                VisitStatus.Confirmed => $"Sua visita ao imóvel {visit.Property.Title} foi confirmada!",
                VisitStatus.Rejected => $"Sua visita ao imóvel {visit.Property.Title} foi recusada.",
                _ => null
            };
            if (message is not null)
            {
                await whatsAppQueue.EnqueueAsync(new WhatsAppQueueMessage(
                    visit.TenantId, visit.Id, tenantSettings.EvolutionInstanceName, visit.VisitorPhone, message), ct);
            }
        }

        var emailOn = tenantSettings?.EmailNotifyEnabled ?? true;
        await emails.SendVisitStatusToVisitorAsync(visit, visit.Property, visit.Tenant, emailOn, ct);
    }
}
