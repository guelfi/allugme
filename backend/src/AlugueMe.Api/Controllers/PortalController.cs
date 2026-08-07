using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Visits;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/portal")]
[Authorize]
public class PortalController(AppDbContext db, IFileStorage storage) : ControllerBase
{
    private bool RequireClient() => User.IsClient() || User.GetRole() == "client";

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
        var user = await db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);
        var email = user.Email.ToLowerInvariant();

        var items = await db.Visits
            .Include(v => v.Property)
            .Include(v => v.Broker)
            .Where(v => v.ClientUserId == userId
                        || (v.VisitorEmail != null && v.VisitorEmail.ToLower() == email))
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
        var email = user.Email.ToLowerInvariant();
        var orphans = await db.Visits
            .Where(v => v.ClientUserId == null && v.VisitorEmail != null && v.VisitorEmail.ToLower() == email)
            .ToListAsync(ct);
        foreach (var v in orphans)
            v.ClientUserId = userId;
        await db.SaveChangesAsync(ct);
        return Ok(new { claimed = orphans.Count });
    }
}
