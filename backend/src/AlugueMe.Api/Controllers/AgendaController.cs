using AlugueMe.Api.Auth;
using AlugueMe.Application.Dtos.Visits;
using AlugueMe.Domain.Entities;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/agenda")]
[Authorize]
public class AgendaController(AppDbContext db) : ControllerBase
{
    [HttpGet("blocks")]
    public async Task<ActionResult<IReadOnlyList<CalendarBlockDto>>> ListBlocks([FromQuery] Guid? brokerId, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var targetBroker = brokerId ?? User.GetUserId();
        var role = User.GetRole();
        if (role == "broker" && targetBroker != User.GetUserId())
            return Forbid();

        var blocks = await db.CalendarBlocks
            .Where(b => b.TenantId == tenantId && b.BrokerId == targetBroker)
            .OrderBy(b => b.StartAt)
            .ToListAsync(ct);

        return Ok(blocks.Select(b => new CalendarBlockDto(b.Id, b.BrokerId, b.StartAt, b.EndAt, b.Reason)));
    }

    [HttpPost("blocks")]
    public async Task<ActionResult<CalendarBlockDto>> CreateBlock([FromBody] CreateCalendarBlockRequest request, CancellationToken ct)
    {
        if (User.IsSaasAdmin() && string.IsNullOrEmpty(User.GetRole()))
            return Forbid();

        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var role = User.GetRole();
        if (role is not ("broker" or "agency_admin" or "independent_broker"))
            return Forbid();

        var block = new CalendarBlock
        {
            Id = Guid.NewGuid(),
            BrokerId = User.GetUserId(),
            TenantId = tenantId.Value,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            Reason = request.Reason
        };
        db.CalendarBlocks.Add(block);
        await db.SaveChangesAsync(ct);

        return Created($"/api/v1/agenda/blocks/{block.Id}",
            new CalendarBlockDto(block.Id, block.BrokerId, block.StartAt, block.EndAt, block.Reason));
    }

    [HttpDelete("blocks/{id:guid}")]
    public async Task<IActionResult> DeleteBlock(Guid id, CancellationToken ct)
    {
        if (User.IsSaasAdmin() && string.IsNullOrEmpty(User.GetRole()))
            return Forbid();

        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var block = await db.CalendarBlocks.FirstOrDefaultAsync(b => b.Id == id && b.TenantId == tenantId, ct);
        if (block is null)
            return NotFound();

        var role = User.GetRole();
        if (role == "broker" && block.BrokerId != User.GetUserId())
            return Forbid();
        if (role is not ("broker" or "agency_admin" or "independent_broker"))
            return Forbid();

        db.CalendarBlocks.Remove(block);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
