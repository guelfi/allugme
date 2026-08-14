using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Visits;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using AlugueMe.Application.Visits;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/portal")]
[Authorize]
public class PortalController(AppDbContext db, IFileStorage storage, IRedisLockService lockService) : ControllerBase
{
    private bool RequireClient() => User.IsClient() || User.GetRole() == "client";

    public record VisitFeedbackRequest(
        int OverallRating,
        int BrokerRating,
        string InterestLevel,
        string? Comment,
        bool WantsContact);
    public record RescheduleVisitRequest(DateTime StartAt);

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var now = DateTime.UtcNow;
        var visits = db.Visits.AsNoTracking().Where(v => v.ClientUserId == userId);
        var nextVisit = await visits
            .Include(v => v.Property).ThenInclude(p => p.Media)
            .Include(v => v.Broker)
            .Where(v => v.Status == VisitStatus.Confirmed && v.StartAt >= now)
            .OrderBy(v => v.StartAt)
            .FirstOrDefaultAsync(ct);
        var pending = await visits.CountAsync(v => v.Status == VisitStatus.Pending, ct);
        var favorites = await db.FavoriteProperties.CountAsync(f => f.UserId == userId, ct);
        var feedbackPending = await visits.CountAsync(v => v.Status == VisitStatus.Done && v.Feedback == null, ct);

        return Ok(new
        {
            pendingVisits = pending,
            favoriteCount = favorites,
            feedbackPending,
            nextVisit = nextVisit is null ? null : new
            {
                nextVisit.Id,
                nextVisit.PropertyId,
                propertyTitle = nextVisit.Property.Title,
                nextVisit.StartAt,
                nextVisit.EndAt,
                brokerName = nextVisit.Broker.Name,
                photoUrl = nextVisit.Property.Media
                    .OrderBy(m => m.SortOrder)
                    .Select(m => storage.GetPublicUrl(m.Path))
                    .FirstOrDefault()
            }
        });
    }

    [HttpGet("favorites")]
    public async Task<ActionResult<IReadOnlyList<object>>> ListFavorites(CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var items = await db.FavoriteProperties
            .AsNoTracking()
            .Include(f => f.Property).ThenInclude(p => p.Media)
            .Include(f => f.Property).ThenInclude(p => p.Tenant)
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

        return Ok(items.Select(f => new
        {
            f.Id,
            f.PropertyId,
            f.CreatedAt,
            title = f.Property.Title,
            city = f.Property.City,
            neighborhood = f.Property.Neighborhood,
            price = f.Property.Price,
            tenantName = f.Property.Tenant.Name,
            tenantSlug = f.Property.Tenant.Slug,
            photoUrl = f.Property.Media
                .Where(m => m.MediaType == PropertyMediaType.Photo)
                .OrderBy(m => m.SortOrder)
                .Select(m => storage.GetPublicUrl(m.Path))
                .FirstOrDefault()
        }));
    }

    [HttpPost("favorites/{propertyId:guid}")]
    public async Task<IActionResult> AddFavorite(Guid propertyId, CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var exists = await db.Properties.AnyAsync(p => p.Id == propertyId && p.Status == PropertyStatus.Published, ct);
        if (!exists) return NotFound(new { message = "Imóvel não encontrado." });

        if (await db.FavoriteProperties.AnyAsync(f => f.UserId == userId && f.PropertyId == propertyId, ct))
            return Ok(new { message = "Já está nos favoritos." });

        db.FavoriteProperties.Add(new FavoriteProperty
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PropertyId = propertyId,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Salvo nos favoritos." });
    }

    [HttpDelete("favorites/{propertyId:guid}")]
    public async Task<IActionResult> RemoveFavorite(Guid propertyId, CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var fav = await db.FavoriteProperties.FirstOrDefaultAsync(f => f.UserId == userId && f.PropertyId == propertyId, ct);
        if (fav is null) return NotFound();
        db.FavoriteProperties.Remove(fav);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("visits")]
    public async Task<ActionResult<IReadOnlyList<VisitDto>>> MyVisits(CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var items = await db.Visits
            .Include(v => v.Property)
            .Include(v => v.Broker)
            .Include(v => v.Feedback)
            .Where(v => v.ClientUserId == userId)
            .OrderByDescending(v => v.StartAt)
            .ToListAsync(ct);

        return Ok(items.Select(DtoMappers.ToDto));
    }

    [HttpPost("claim-visits")]
    public async Task<IActionResult> ClaimVisits(CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var user = await db.Users.FirstAsync(u => u.Id == userId, ct);
        if (user.EmailVerifiedAt is null)
            return Conflict(new { message = "Confirme seu e-mail antes de vincular visitas." });
        var email = user.Email.ToLowerInvariant();
        var orphans = await db.Visits
            .Where(v => v.ClientUserId == null && v.VisitorEmail != null && v.VisitorEmail.ToLower() == email)
            .ToListAsync(ct);
        foreach (var v in orphans)
            v.ClientUserId = userId;
        await db.SaveChangesAsync(ct);
        return Ok(new { claimed = orphans.Count });
    }

    [HttpPost("visits/{visitId:guid}/cancel")]
    public async Task<IActionResult> CancelVisit(Guid visitId, CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var visit = await db.Visits.FirstOrDefaultAsync(v => v.Id == visitId && v.ClientUserId == userId, ct);
        if (visit is null) return NotFound();
        if (visit.Status is not (VisitStatus.Pending or VisitStatus.Confirmed))
            return Conflict(new { message = "Esta visita não pode mais ser cancelada." });
        if (visit.StartAt <= DateTime.UtcNow.AddHours(2))
            return Conflict(new { message = "Cancelamentos pelo portal são permitidos até 2 horas antes. Fale com a imobiliária." });
        visit.Status = VisitStatus.Cancelled;
        visit.CancelledAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Visita cancelada." });
    }

    [HttpPost("visits/{visitId:guid}/reschedule")]
    public async Task<IActionResult> RescheduleVisit(Guid visitId, [FromBody] RescheduleVisitRequest request, CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        var userId = User.GetUserId();
        var visit = await db.Visits.Include(v => v.Property).Include(v => v.Tenant).ThenInclude(t => t.Settings)
            .FirstOrDefaultAsync(v => v.Id == visitId && v.ClientUserId == userId, ct);
        if (visit is null) return NotFound();
        if (visit.Status is not (VisitStatus.Pending or VisitStatus.Confirmed))
            return Conflict(new { message = "Esta visita não pode ser reagendada." });
        if (visit.StartAt <= DateTime.UtcNow.AddHours(2) || request.StartAt <= DateTime.UtcNow)
            return Conflict(new { message = "Reagende com pelo menos 2 horas de antecedência." });

        await using var redisLock = await lockService.AcquireLockAsync($"visit:broker:{visit.BrokerId}", TimeSpan.FromSeconds(30), ct);
        if (redisLock is null) return Conflict(new { message = "Agenda ocupada, tente novamente." });

        var brokerSettings = await db.BrokerSettings.AsNoTracking()
            .FirstOrDefaultAsync(b => b.UserId == visit.BrokerId && b.TenantId == visit.TenantId, ct);
        var duration = brokerSettings?.VisitDurationMinutes ?? visit.Tenant.Settings?.VisitDurationMinutes ?? 60;
        var buffer = brokerSettings?.BufferMinutes ?? visit.Tenant.Settings?.BufferMinutes ?? 60;
        var localStart = VisitSlotCalculator.ToSaoPaulo(request.StartAt);
        var hours = await AvailabilityResolver.ResolveAsync(db, visit.TenantId, visit.BrokerId, localStart.DayOfWeek, ct);
        if (hours.IsClosed || TimeOnly.FromDateTime(localStart) < hours.Start || TimeOnly.FromDateTime(localStart.AddMinutes(duration)) > hours.End)
            return Conflict(new { message = "Horário fora da disponibilidade do corretor." });

        var endAt = request.StartAt.AddMinutes(duration);
        var conflict = await db.Visits.AnyAsync(v => v.Id != visit.Id && v.BrokerId == visit.BrokerId
            && (v.Status == VisitStatus.Pending || v.Status == VisitStatus.Confirmed)
            && request.StartAt < v.EndAt.AddMinutes(v.BufferMinutesApplied)
            && endAt.AddMinutes(buffer) > v.StartAt, ct);
        conflict = conflict || await db.CalendarBlocks.AnyAsync(b => b.BrokerId == visit.BrokerId
            && request.StartAt < b.EndAt && endAt.AddMinutes(buffer) > b.StartAt, ct);
        if (conflict) return Conflict(new { message = "Horário indisponível." });

        visit.StartAt = request.StartAt;
        visit.EndAt = endAt;
        visit.BufferMinutesApplied = buffer;
        visit.Status = VisitStatus.Pending;
        visit.ConfirmedAt = null;
        visit.Reminder24hSentAt = null;
        visit.Reminder2hSentAt = null;
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Reagendamento solicitado. Aguarde a confirmação do corretor." });
    }

    [HttpPost("visits/{visitId:guid}/feedback")]
    public async Task<IActionResult> SubmitFeedback(Guid visitId, [FromBody] VisitFeedbackRequest request, CancellationToken ct)
    {
        if (!RequireClient()) return Forbid();
        if (request.OverallRating is < 1 or > 5 || request.BrokerRating is < 1 or > 5)
            return BadRequest(new { message = "As avaliações devem estar entre 1 e 5." });
        var allowedInterest = new[] { "not_interested", "other_options", "interested", "make_offer" };
        if (!allowedInterest.Contains(request.InterestLevel))
            return BadRequest(new { message = "Nível de interesse inválido." });

        var userId = User.GetUserId();
        var visit = await db.Visits.Include(v => v.Feedback)
            .FirstOrDefaultAsync(v => v.Id == visitId && v.ClientUserId == userId, ct);
        if (visit is null) return NotFound();
        if (visit.Status != VisitStatus.Done || visit.CompletedAt is null)
            return Conflict(new { message = "A visita somente pode ser avaliada depois de concluída." });
        if (visit.Feedback is not null)
            return Conflict(new { message = "Esta visita já foi avaliada." });

        db.VisitFeedbacks.Add(new VisitFeedback
        {
            Id = Guid.NewGuid(), VisitId = visit.Id, ClientUserId = userId,
            OverallRating = request.OverallRating, BrokerRating = request.BrokerRating,
            InterestLevel = request.InterestLevel, Comment = request.Comment?.Trim(),
            WantsContact = request.WantsContact
        });
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Obrigado pela sua opinião." });
    }
}
