using AlugueMe.Api.Auth;
using AlugueMe.Application.Common;
using AlugueMe.Application.Dtos.Properties;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
[Route("api/v1/properties")]
[Authorize]
public class PropertiesController(AppDbContext db, IFileStorage storage) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PropertyDto>>> List(CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var role = User.GetRole();
        var userId = User.GetUserId();
        var query = db.Properties
            .Include(p => p.Media)
            .Where(p => p.TenantId == tenantId);

        if (role == "broker" && !User.IsSaasAdmin())
            query = query.Where(p => p.ResponsibleBrokerId == userId);

        var items = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        return Ok(items.Select(p => DtoMappers.ToDto(p, storage.GetPublicUrl)));
    }

    [HttpPost]
    public async Task<ActionResult<PropertyDto>> Create([FromBody] CreatePropertyRequest request, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest(new { message = "Contexto de tenant não definido." });

        var brokerId = request.ResponsibleBrokerId ?? User.GetUserId();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            ResponsibleBrokerId = brokerId,
            Operation = EnumMapper.ParsePropertyOperation(request.Operation),
            PropertyType = EnumMapper.ParsePropertyType(request.PropertyType),
            Title = request.Title,
            Description = request.Description,
            City = request.City,
            Neighborhood = request.Neighborhood,
            Price = request.Price,
            Bedrooms = request.Bedrooms,
            AreaSqm = request.AreaSqm,
            Status = PropertyStatus.Draft
        };
        db.Properties.Add(property);
        await db.SaveChangesAsync(ct);

        return Created($"/api/v1/properties/{property.Id}", DtoMappers.ToDto(property, storage.GetPublicUrl));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PropertyDto>> Get(Guid id, CancellationToken ct)
    {
        var property = await FindPropertyAsync(id, ct);
        if (property is null)
            return NotFound();
        return Ok(DtoMappers.ToDto(property, storage.GetPublicUrl));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PropertyDto>> Update(Guid id, [FromBody] UpdatePropertyRequest request, CancellationToken ct)
    {
        var property = await FindPropertyAsync(id, ct);
        if (property is null)
            return NotFound();

        if (!CanEdit(property))
            return Forbid();

        if (request.Operation is not null) property.Operation = EnumMapper.ParsePropertyOperation(request.Operation);
        if (request.PropertyType is not null) property.PropertyType = EnumMapper.ParsePropertyType(request.PropertyType);
        if (request.Title is not null) property.Title = request.Title;
        if (request.Description is not null) property.Description = request.Description;
        if (request.City is not null) property.City = request.City;
        if (request.Neighborhood is not null) property.Neighborhood = request.Neighborhood;
        if (request.Price is not null) property.Price = request.Price.Value;
        if (request.Bedrooms is not null) property.Bedrooms = request.Bedrooms.Value;
        if (request.AreaSqm is not null) property.AreaSqm = request.AreaSqm.Value;
        if (request.ResponsibleBrokerId is not null) property.ResponsibleBrokerId = request.ResponsibleBrokerId.Value;

        await db.SaveChangesAsync(ct);
        return Ok(DtoMappers.ToDto(property, storage.GetPublicUrl));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var property = await FindPropertyAsync(id, ct);
        if (property is null)
            return NotFound();
        if (!CanEdit(property))
            return Forbid();

        db.Properties.Remove(property);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<PropertyDto>> Publish(Guid id, CancellationToken ct)
    {
        var property = await FindPropertyAsync(id, ct);
        if (property is null)
            return NotFound();
        if (!CanEdit(property))
            return Forbid();

        property.Status = PropertyStatus.Published;
        property.PublishedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(DtoMappers.ToDto(property, storage.GetPublicUrl));
    }

    [HttpPost("{id:guid}/media")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<PropertyMediaDto>> UploadMedia(Guid id, IFormFile file, CancellationToken ct)
    {
        var property = await FindPropertyAsync(id, ct);
        if (property is null)
            return NotFound();
        if (!CanEdit(property))
            return Forbid();

        if (file.Length == 0 || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Arquivo de imagem inválido." });

        await using var stream = file.OpenReadStream();
        var path = await storage.SaveAsync(stream, file.FileName, file.ContentType, ct);
        var sortOrder = property.Media.Count;
        var media = new PropertyMedia
        {
            Id = Guid.NewGuid(),
            PropertyId = property.Id,
            Path = path,
            SortOrder = sortOrder
        };
        db.PropertyMedia.Add(media);
        await db.SaveChangesAsync(ct);

        return Ok(new PropertyMediaDto(media.Id, storage.GetPublicUrl(media.Path), media.SortOrder));
    }

    private async Task<Property?> FindPropertyAsync(Guid id, CancellationToken ct)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return null;

        return await db.Properties
            .Include(p => p.Media)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId, ct);
    }

    private bool CanEdit(Property property)
    {
        if (User.IsSaasAdmin())
            return true;

        var role = User.GetRole();
        if (role is "agency_admin" or "independent_broker")
            return true;

        return role == "broker" && property.ResponsibleBrokerId == User.GetUserId();
    }
}
