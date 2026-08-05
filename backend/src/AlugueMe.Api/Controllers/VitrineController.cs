using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Persistence;
using AlugueMe.Infrastructure.Themes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

[ApiController]
public class VitrineController(AppDbContext db, IThemeRenderer themeRenderer, IConfiguration configuration) : ControllerBase
{
    [HttpGet("/t/{slug}/{page?}")]
    public Task<IActionResult> Page(string slug, string? page, CancellationToken ct)
    {
        page = string.IsNullOrWhiteSpace(page) ? "home" : page;
        page = page.EndsWith(".html", StringComparison.OrdinalIgnoreCase)
            ? page[..^5]
            : page.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(page))
            page = "home";
        return RenderAsync(slug, page, ct);
    }

    private async Task<IActionResult> RenderAsync(string slug, string page, CancellationToken ct)
    {
        var tenant = await db.Tenants
            .Include(t => t.Settings)
            .FirstOrDefaultAsync(t => t.Slug == slug &&
                (t.Status == Domain.Enums.TenantStatus.Active || t.Status == Domain.Enums.TenantStatus.Trial), ct);

        if (tenant is null)
            return NotFound();

        // API/painel ficam sob /allugme; assets da vitrine na raiz (/themes/...).
        var publicBase = configuration["PublicBasePath"]?.TrimEnd('/') ?? "";
        var apiBase = string.IsNullOrEmpty(publicBase) ? "/api/v1" : $"{publicBase}/api/v1";
        var themesBase = configuration["VitrineThemesBasePath"] ?? "";

        var placeholders = new Dictionary<string, string>
        {
            ["tenant.name"] = tenant.Name,
            ["tenant.logo_url"] = "",
            ["tenant.phone"] = tenant.Settings?.WhatsAppE164 ?? "",
            ["visit.slots_endpoint"] = $"{apiBase}/public/properties/{{propertyId}}/visit-slots",
            ["visit.submit_endpoint"] = $"{apiBase}/public/visits",
            ["search.filters"] = "",
            ["property.title"] = "",
            ["property.price"] = "",
            ["property.city"] = "",
            ["property.neighborhood"] = "",
            ["property.bedrooms"] = "",
            ["property.operation"] = "",
            ["property.images"] = "",
            ["properties"] = ""
        };

        var html = await themeRenderer.RenderPageAsync(tenant.ThemeKey, page, placeholders, ct);
        html = ThemeAssetUrlRewriter.Rewrite(html, tenant.ThemeKey, themesBase);
        return Content(html, "text/html; charset=utf-8");
    }
}
