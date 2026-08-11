using AlugueMe.Api.Auth;
using AlugueMe.Infrastructure.Persistence;
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
    string? TenantName);

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
                    last?.Tenant?.Name);
            }).ToList();

            return Ok(registeredClientDtos);
        }

        var role = User.GetRole();
        var query = db.Visits.AsNoTracking().Include(v => v.Tenant).AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(v => v.TenantId == tenantId);

        if (role == "broker" && !User.IsSaasAdmin())
            query = query.Where(v => v.BrokerId == User.GetUserId());

        var visits = await query.ToListAsync(ct);

        var clients = visits
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
                    last.Tenant?.Name);
            })
            .OrderByDescending(c => c.LastVisitAt)
            .ToList();

        return Ok(clients);
    }
}
