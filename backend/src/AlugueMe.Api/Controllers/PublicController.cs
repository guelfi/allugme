using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Payments;
using AlugueMe.Application.Dtos.Properties;
using AlugueMe.Application.Dtos.Visits;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Payments;
using AlugueMe.Application.Visits;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/public")]
[AllowAnonymous]
public class PublicController(
    AppDbContext db,
    VisitSlotCalculator slotCalculator,
    IFileStorage storage,
    IRedisLockService lockService,
    IWhatsAppQueue whatsAppQueue,
    IOptions<PixOptions> pixOptions,
    IQrCodeGenerator qrCodeGenerator) : ControllerBase
{
    [HttpPost("pix/quote")]
    public ActionResult<PixQuoteResponse> QuotePix([FromBody] PixQuoteRequest request)
    {
        var accountType = (request.AccountType ?? "agency").Trim().ToLowerInvariant();
        var plan = (request.Plan ?? "monthly").Trim().ToLowerInvariant() == "yearly" ? "yearly" : "monthly";
        var amount = PlanCatalog.GetAmount(accountType, plan);
        var planLabel = PlanCatalog.GetLabel(accountType, plan);
        var txId = PixReferenceGenerator.Generate();

        var pix = pixOptions.Value;
        var copyPaste = PixBrCodeBuilder.Build(pix.Key, pix.MerchantName, pix.MerchantCity, amount, txId);
        var qrPng = qrCodeGenerator.GeneratePng(copyPaste);

        return Ok(new PixQuoteResponse(
            amount,
            planLabel,
            pix.Key,
            pix.MerchantName,
            pix.MerchantCity,
            txId,
            copyPaste,
            Convert.ToBase64String(qrPng)));
    }

    [HttpGet("properties")]
    public async Task<ActionResult<PublicPropertySearchResult>> Search(
        [FromQuery] string? city,
        [FromQuery] string? neighborhood,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? bedrooms,
        [FromQuery] string? operation,
        [FromQuery] string? tenantSlug,
        CancellationToken ct)
    {
        var query = db.Properties
            .Include(p => p.Tenant)
            .Include(p => p.Media)
            .Where(p => p.Status == PropertyStatus.Published && p.Tenant.Status == TenantStatus.Active);

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(p => EF.Functions.ILike(p.City, $"%{city}%"));
        if (!string.IsNullOrWhiteSpace(neighborhood))
            query = query.Where(p => EF.Functions.ILike(p.Neighborhood, $"%{neighborhood}%"));
        if (maxPrice is not null)
            query = query.Where(p => p.Price <= maxPrice);
        if (bedrooms is not null)
            query = query.Where(p => p.Bedrooms >= bedrooms);
        if (!string.IsNullOrWhiteSpace(operation))
            query = query.Where(p => p.Operation == EnumMapper.ParsePropertyOperation(operation));
        if (!string.IsNullOrWhiteSpace(tenantSlug))
            query = query.Where(p => p.Tenant.Slug == tenantSlug);

        var items = await query.OrderByDescending(p => p.PublishedAt).Take(100).ToListAsync(ct);
        var dtos = items.Select(p => new PublicPropertyDto(
            p.Id, p.Title, p.Description, p.City, p.Neighborhood, p.Price, p.Bedrooms, p.AreaSqm,
            EnumMapper.ToApi(p.Operation), EnumMapper.ToApi(p.PropertyType),
            p.Tenant.Name, p.Tenant.Slug,
            p.Media.OrderBy(m => m.SortOrder).Select(m => storage.GetPublicUrl(m.Path)).ToList())).ToList();

        return Ok(new PublicPropertySearchResult(dtos, dtos.Count));
    }

    [HttpGet("properties/{id:guid}")]
    public async Task<ActionResult<PublicPropertyDto>> GetProperty(Guid id, CancellationToken ct)
    {
        var p = await db.Properties
            .Include(x => x.Tenant)
            .Include(x => x.Media)
            .FirstOrDefaultAsync(x => x.Id == id && x.Status == PropertyStatus.Published && x.Tenant.Status == TenantStatus.Active, ct);

        if (p is null)
            return NotFound();

        return Ok(new PublicPropertyDto(
            p.Id, p.Title, p.Description, p.City, p.Neighborhood, p.Price, p.Bedrooms, p.AreaSqm,
            EnumMapper.ToApi(p.Operation), EnumMapper.ToApi(p.PropertyType),
            p.Tenant.Name, p.Tenant.Slug,
            p.Media.OrderBy(m => m.SortOrder).Select(m => storage.GetPublicUrl(m.Path)).ToList()));
    }

    [HttpGet("properties/{id:guid}/visit-slots")]
    public async Task<ActionResult<VisitSlotsResponse>> GetVisitSlots(Guid id, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        var property = await db.Properties
            .Include(p => p.Tenant).ThenInclude(t => t.Settings)
            .FirstOrDefaultAsync(p => p.Id == id && p.Status == PropertyStatus.Published && p.Tenant.Status == TenantStatus.Active, ct);

        if (property is null)
            return NotFound();

        var targetDate = date ?? DateOnly.FromDateTime(VisitSlotCalculator.ToSaoPaulo(DateTime.UtcNow));
        if (targetDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            return Ok(new VisitSlotsResponse([]));

        var settings = await ResolveSlotSettingsAsync(property.ResponsibleBrokerId, property.TenantId, property.Tenant.Settings, ct);
        var dayStart = VisitSlotCalculator.ToUtc(targetDate, new TimeOnly(0, 0));
        var dayEnd = VisitSlotCalculator.ToUtc(targetDate.AddDays(1), new TimeOnly(0, 0));

        var visits = await db.Visits
            .Where(v => v.BrokerId == property.ResponsibleBrokerId &&
                        (v.Status == VisitStatus.Pending || v.Status == VisitStatus.Confirmed) &&
                        v.StartAt >= dayStart && v.StartAt < dayEnd)
            .ToListAsync(ct);

        var blocks = await db.CalendarBlocks
            .Where(b => b.BrokerId == property.ResponsibleBrokerId && b.StartAt < dayEnd && b.EndAt > dayStart)
            .ToListAsync(ct);

        var occupied = visits.Select(v => VisitSlotCalculator.FromVisit(v.StartAt, v.EndAt, v.BufferMinutesApplied))
            .Concat(blocks.Select(b => new OccupiedInterval(b.StartAt, b.EndAt)))
            .ToList();

        var slots = slotCalculator.CalculateSlots(targetDate, settings, occupied)
            .Where(s => s.Start > DateTime.UtcNow)
            .Select(s => new VisitSlotDto(s.Start, s.End))
            .ToList();

        return Ok(new VisitSlotsResponse(slots));
    }

    [HttpPost("visits")]
    public async Task<ActionResult<VisitDto>> CreateVisit([FromBody] CreateVisitRequest request, CancellationToken ct)
    {
        var property = await db.Properties
            .Include(p => p.Tenant).ThenInclude(t => t.Settings)
            .FirstOrDefaultAsync(p => p.Id == request.PropertyId && p.Status == PropertyStatus.Published && p.Tenant.Status == TenantStatus.Active, ct);

        if (property is null)
            return NotFound(new { message = "Imóvel não disponível." });

        await using var redisLock = await lockService.AcquireLockAsync($"visit:broker:{property.ResponsibleBrokerId}", TimeSpan.FromSeconds(30), ct);
        if (redisLock is null)
            return Conflict(new { message = "Agenda ocupada, tente novamente." });

        var settings = await ResolveSlotSettingsAsync(property.ResponsibleBrokerId, property.TenantId, property.Tenant.Settings, ct);
        var endAt = request.StartAt.AddMinutes(settings.DurationMinutes);

        var hasConflict = await db.Visits.AnyAsync(v =>
            v.BrokerId == property.ResponsibleBrokerId &&
            (v.Status == VisitStatus.Pending || v.Status == VisitStatus.Confirmed) &&
            request.StartAt < v.EndAt.AddMinutes(v.BufferMinutesApplied) &&
            endAt.AddMinutes(settings.BufferMinutes) > v.StartAt, ct);

        if (hasConflict)
            return Conflict(new { message = "Horário indisponível." });

        var visit = new Visit
        {
            Id = Guid.NewGuid(),
            PropertyId = property.Id,
            TenantId = property.TenantId,
            BrokerId = property.ResponsibleBrokerId,
            VisitorName = request.VisitorName,
            VisitorPhone = request.VisitorPhone,
            VisitorEmail = request.VisitorEmail,
            StartAt = request.StartAt,
            EndAt = endAt,
            BufferMinutesApplied = settings.BufferMinutes,
            Status = VisitStatus.Pending,
            ConfirmationCode = ConfirmationCodeGenerator.Generate()
        };
        db.Visits.Add(visit);
        await db.SaveChangesAsync(ct);

        await EnqueueVisitNotificationAsync(visit, property, ct);

        await db.Entry(visit).Reference(v => v.Property).LoadAsync(ct);
        await db.Entry(visit).Reference(v => v.Broker).LoadAsync(ct);
        return Created($"/api/v1/visits/{visit.Id}", DtoMappers.ToDto(visit));
    }

    private async Task<VisitSlotSettings> ResolveSlotSettingsAsync(Guid brokerId, Guid tenantId, TenantSettings? tenantSettings, CancellationToken ct)
    {
        var brokerSettings = await db.BrokerSettings.FirstOrDefaultAsync(b => b.UserId == brokerId && b.TenantId == tenantId, ct);
        var duration = brokerSettings?.VisitDurationMinutes ?? tenantSettings?.VisitDurationMinutes ?? 60;
        var buffer = brokerSettings?.BufferMinutes ?? tenantSettings?.BufferMinutes ?? 60;
        return new VisitSlotSettings(duration, buffer);
    }

    private async Task EnqueueVisitNotificationAsync(Visit visit, Property property, CancellationToken ct)
    {
        var tenantSettings = await db.TenantSettings.FindAsync([property.TenantId], ct);
        var brokerSettings = await db.BrokerSettings.FirstOrDefaultAsync(b => b.UserId == property.ResponsibleBrokerId && b.TenantId == property.TenantId, ct);

        string? to = null;
        string? instance = tenantSettings?.EvolutionInstanceName;

        if (brokerSettings?.WhatsAppNotifyEnabled == true && !string.IsNullOrWhiteSpace(brokerSettings.WhatsAppE164))
            to = brokerSettings.WhatsAppE164;
        else if (tenantSettings?.WhatsAppNotifyEnabled == true && !string.IsNullOrWhiteSpace(tenantSettings.WhatsAppE164))
            to = tenantSettings.WhatsAppE164;

        if (string.IsNullOrWhiteSpace(to) || string.IsNullOrWhiteSpace(instance))
            return;

        var spTime = VisitSlotCalculator.ToSaoPaulo(visit.StartAt);
        var text = $"Nova visita solicitada!\nImóvel: {property.Title}\nVisitante: {visit.VisitorName}\nData: {spTime:dd/MM/yyyy HH:mm}\nCódigo: {visit.ConfirmationCode}\nResponda SIM {visit.ConfirmationCode} para confirmar ou NAO {visit.ConfirmationCode} para recusar.";

        await whatsAppQueue.EnqueueAsync(new WhatsAppQueueMessage(property.TenantId, visit.Id, instance, to, text), ct);
    }
}
