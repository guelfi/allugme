using AlugueMe.Api.Auth;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

public record AdminStatsDto(int Agencies, int IndependentBrokers, int Properties, int Clients);

[ApiController]
[Route("api/v1/admin")]
[Authorize]
public class AdminController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Totais globais da plataforma para o painel do SaaS Admin (somente leitura).
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats(CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var agencies = await db.Tenants.CountAsync(t => t.Type == TenantType.Agency, ct);
        var independents = await db.Tenants.CountAsync(t => t.Type == TenantType.Independent, ct);
        var properties = await db.Properties.CountAsync(ct);

        var clients = await db.Users.CountAsync(u => u.IsClient, ct);

        return Ok(new AdminStatsDto(agencies, independents, properties, clients));
    }
}
