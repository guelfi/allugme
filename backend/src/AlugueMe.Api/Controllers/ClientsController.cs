using AlugueMe.Api.Auth;
using AlugueMe.Infrastructure.Persistence;
using AlugueMe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

public record ClientDto(
    Guid? ClientUserId,
    string VisitorName,
    string VisitorPhone,
    string? VisitorEmail,
    int VisitCount,
    DateTime? LastVisitAt,
    DateTime? RegisteredAt,
    Guid? TenantId,
    string? TenantName,
    double? AverageVisitRating = null,
    string? LatestInterestLevel = null,
    bool WantsContact = false);

[ApiController]
[Route("api/v1/clients")]
[Authorize]
public class ClientsController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Lista visitantes agregados a partir das visitas (CRM leve).
    /// SaaS: todos os tenants (somente leitura). Tenant: apenas o próprio.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClientDto>>> List(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null && !User.IsSaasAdmin())
            return BadRequest(new { message = "Contexto de tenant não definido." });

        if (User.IsSaasAdmin())
        {
            var registeredClients = await db.Users
                .AsNoTracking()
                .Where(u => u.IsClient)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync(ct);

            var clientIds = registeredClients.Select(u => u.Id).ToList();
            var clientEmails = registeredClients.Select(u => u.Email.ToLower()).ToList();
            var relatedVisits = await db.Visits
                .AsNoTracking()
                .Include(v => v.Tenant)
                .Include(v => v.Feedback)
                .Where(v => (v.ClientUserId.HasValue && clientIds.Contains(v.ClientUserId.Value))
                    || (v.VisitorEmail != null && clientEmails.Contains(v.VisitorEmail.ToLower())))
                .ToListAsync(ct);

            var registeredClientDtos = registeredClients.Select(client =>
            {
                var visits = relatedVisits
                    .Where(v => v.ClientUserId == client.Id
                        || (v.VisitorEmail != null
                            && v.VisitorEmail.Equals(client.Email, StringComparison.OrdinalIgnoreCase)))
                    .OrderByDescending(v => v.StartAt)
                    .ToList();
                var last = visits.FirstOrDefault();

                return new ClientDto(
                    client.Id,
                    client.Name,
                    client.Phone ?? string.Empty,
                    client.Email,
                    visits.Count,
                    last?.StartAt,
                    client.CreatedAt,
                    last?.TenantId,
                    last?.Tenant?.Name,
                    visits.Where(v => v.Feedback != null).Select(v => (double?)v.Feedback!.OverallRating).Average(),
                    visits.FirstOrDefault(v => v.Feedback != null)?.Feedback?.InterestLevel,
                    visits.Any(v => v.Feedback?.WantsContact == true));
            }).ToList();

            return Ok(registeredClientDtos);
        }

        var scopedTenantId = tenantId!.Value;
        var scopedTenantName = await db.Tenants
            .AsNoTracking()
            .Where(t => t.Id == scopedTenantId)
            .Select(t => t.Name)
            .SingleAsync(ct);
        var role = User.GetRole();
        IQueryable<AlugueMe.Domain.Entities.Visit> query = db.Visits
            .AsNoTracking()
            .Include(v => v.Tenant)
            .Include(v => v.ClientUser)
            .Include(v => v.Feedback);

        // Um corretor afiliado enxerga somente visitantes das próprias visitas.
        // A visão ampliada por favoritos pertence apenas à administração da imobiliária.
        query = ClientVisibilityPolicy.ScopeVisits(query, scopedTenantId, role, User.GetUserId());

        var visits = await query.ToListAsync(ct);
        var relatedClientIds = visits
            .Where(v => v.ClientUserId.HasValue)
            .Select(v => v.ClientUserId!.Value)
            .ToHashSet();

        if (role != "broker")
        {
            var favoriteClientIds = await db.FavoriteProperties
                .AsNoTracking()
                .Where(f => f.Property.TenantId == scopedTenantId && f.User.IsClient)
                .Select(f => f.UserId)
                .Distinct()
                .ToListAsync(ct);
            relatedClientIds.UnionWith(favoriteClientIds);
        }

        var tenantRegisteredClients = await db.Users
            .AsNoTracking()
            .Where(u => u.IsClient && relatedClientIds.Contains(u.Id))
            .ToListAsync(ct);

        var registeredDtos = tenantRegisteredClients.Select(client =>
        {
            var clientVisits = visits
                .Where(v => v.ClientUserId == client.Id
                    || (v.VisitorEmail != null
                        && v.VisitorEmail.Equals(client.Email, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(v => v.StartAt)
                .ToList();
            var last = clientVisits.FirstOrDefault();
            return new ClientDto(
                client.Id,
                client.Name,
                client.Phone ?? string.Empty,
                client.Email,
                clientVisits.Count,
                last?.StartAt,
                client.CreatedAt,
                scopedTenantId,
                scopedTenantName,
                clientVisits.Where(v => v.Feedback != null).Select(v => (double?)v.Feedback!.OverallRating).Average(),
                clientVisits.FirstOrDefault(v => v.Feedback != null)?.Feedback?.InterestLevel,
                clientVisits.Any(v => v.Feedback?.WantsContact == true));
        });

        var registeredEmails = tenantRegisteredClients
            .Select(c => c.Email.ToLowerInvariant())
            .ToHashSet();

        var anonymousDtos = visits
            .Where(v => v.ClientUserId == null
                && (v.VisitorEmail == null || !registeredEmails.Contains(v.VisitorEmail.ToLower())))
            .GroupBy(v => new
            {
                Phone = (v.VisitorPhone ?? "").Trim(),
                Name = (v.VisitorName ?? "").Trim(),
                v.TenantId
            })
            .Where(g => !string.IsNullOrWhiteSpace(g.Key.Phone) || !string.IsNullOrWhiteSpace(g.Key.Name))
            .Select(g =>
            {
                var last = g.OrderByDescending(v => v.StartAt).First();
                return new ClientDto(
                    last.ClientUserId,
                    last.VisitorName,
                    last.VisitorPhone,
                    last.VisitorEmail,
                    g.Count(),
                    last.StartAt,
                    last.ClientUser?.CreatedAt,
                    g.Key.TenantId,
                    last.Tenant?.Name,
                    g.Where(v => v.Feedback != null).Select(v => (double?)v.Feedback!.OverallRating).Average(),
                    g.FirstOrDefault(v => v.Feedback != null)?.Feedback?.InterestLevel,
                    g.Any(v => v.Feedback?.WantsContact == true));
            })
            .ToList();

        var clients = registeredDtos
            .Concat(anonymousDtos)
            .OrderByDescending(c => c.LastVisitAt ?? c.RegisteredAt)
            .ToList();

        return Ok(clients);
    }
}
