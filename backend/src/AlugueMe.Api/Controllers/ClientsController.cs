using AlugueMe.Api.Auth;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

public record ClientDto(
    string VisitorName,
    string VisitorPhone,
    string? VisitorEmail,
    int VisitCount,
    DateTime LastVisitAt,
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
                    last.VisitorName,
                    last.VisitorPhone,
                    last.VisitorEmail,
                    g.Count(),
                    last.StartAt,
                    g.Key.TenantId,
                    last.Tenant?.Name);
            })
            .OrderByDescending(c => c.LastVisitAt)
            .ToList();

        return Ok(clients);
    }
}
