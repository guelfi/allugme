using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using AlugueMe.Application.Common;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Themes;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AlugueMe.Infrastructure.Themes;

public partial class VitrineComposer(
    AppDbContext db,
    IThemeRenderer themeRenderer,
    IThemeResolver themeResolver,
    IFileStorage storage,
    IDashboardBaseUrl dashboardBaseUrl,
    IConfiguration configuration) : IVitrineComposer
{
    private static readonly HashSet<string> RawKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "properties", "property.images", "search.filters", "vitrine.runtime"
    };

    public async Task<VitrineHtml> ComposeAsync(VitrineComposeRequest request, CancellationToken cancellationToken = default)
    {
        var tenant = await db.Tenants
            .Include(t => t.Settings)
            .FirstOrDefaultAsync(t => t.Slug == request.Slug &&
                (t.Status == TenantStatus.Active || t.Status == TenantStatus.Trial), cancellationToken);

        if (tenant is null)
            return new VitrineHtml(string.Empty, 404);

        var publicBase = configuration["PublicBasePath"]?.TrimEnd('/') ?? "";
        var apiBase = string.IsNullOrEmpty(publicBase) ? "/api/v1" : $"{publicBase}/api/v1";
        var themesBase = configuration["VitrineThemesBasePath"] ?? "";
        var location = await themeResolver.ResolveAsync(tenant.ThemeKey, tenant.Id, cancellationToken);

        var applyFilters = string.Equals(request.Page, "listing", StringComparison.OrdinalIgnoreCase);
        var properties = await LoadPropertiesAsync(tenant.Id, applyFilters ? request.Search : ThemeSearchQuery.Empty, cancellationToken);
        if (!applyFilters)
            properties = properties.Take(6).ToList();

        Property? current = null;
        if (request.PropertyId is Guid propertyId)
        {
            current = await db.Properties
                .Include(p => p.Media)
                .FirstOrDefaultAsync(p => p.Id == propertyId && p.TenantId == tenant.Id && p.Status == PropertyStatus.Published, cancellationToken);
        }

        var cardsHtml = await RenderCardsAsync(location, properties, cancellationToken);
        if (string.IsNullOrWhiteSpace(cardsHtml) && applyFilters)
            cardsHtml = "<p class=\"vitrine-empty\" data-vitrine-empty>Nenhum imóvel encontrado com esses filtros.</p>";

        var imageUrl = CoverUrl(current, location);
        var slotsEndpoint = current is null
            ? $"{apiBase}/public/properties/{{propertyId}}/visit-slots"
            : $"{apiBase}/public/properties/{current.Id}/visit-slots";

        var placeholders = new Dictionary<string, string>
        {
            ["tenant.name"] = tenant.Name,
            ["tenant.slug"] = tenant.Slug,
            ["tenant.logo_url"] = "",
            ["tenant.phone"] = tenant.Settings?.WhatsAppE164 ?? "",
            ["api.base"] = apiBase,
            ["app.dashboard_url"] = dashboardBaseUrl.GetBaseUrl(),
            ["visit.slots_endpoint"] = slotsEndpoint,
            ["visit.submit_endpoint"] = $"{apiBase}/public/visits",
            ["search.filters"] = "",
            ["property.id"] = current?.Id.ToString() ?? "",
            ["property.title"] = current?.Title ?? "",
            ["property.description"] = current?.Description ?? "",
            ["property.price"] = current is null ? "" : FormatPrice(current.Price, current.Operation),
            ["property.city"] = current?.City ?? "",
            ["property.neighborhood"] = current?.Neighborhood ?? "",
            ["property.bedrooms"] = current?.Bedrooms.ToString(CultureInfo.InvariantCulture) ?? "",
            ["property.operation"] = current is null ? "" : OperationLabel(current.Operation),
            ["property.operation_key"] = current is null ? "" : EnumMapper.ToApi(current.Operation),
            ["property.images"] = request.Page.Equals("property", StringComparison.OrdinalIgnoreCase)
                ? GalleryHtml(current, location)
                : imageUrl,
            ["properties"] = cardsHtml,
            ["vitrine.runtime"] = ""
        };

        var html = await themeRenderer.RenderPageAsync(location, request.Page, placeholders, RawKeys, cancellationToken);
        html = ThemeAssetUrlRewriter.Rewrite(html, location.PublicAssetKey, themesBase);
        html = PreviewOnlyBlocks().Replace(html, string.Empty);
        html = InjectRuntime(html, new
        {
            apiBase,
            dashboardUrl = dashboardBaseUrl.GetBaseUrl(),
            tenantSlug = tenant.Slug,
            themeKey = location.PublicAssetKey,
            page = request.Page,
            propertyId = current?.Id,
            property = current is null ? null : new
            {
                id = current.Id,
                title = current.Title,
                description = current.Description,
                city = current.City,
                neighborhood = current.Neighborhood,
                bedrooms = current.Bedrooms,
                price = FormatPrice(current.Price, current.Operation),
                operation = OperationLabel(current.Operation),
                imageUrl
            }
        });

        return new VitrineHtml(html, 200);
    }

    private async Task<List<Property>> LoadPropertiesAsync(Guid tenantId, ThemeSearchQuery search, CancellationToken ct)
    {
        var query = db.Properties
            .Include(p => p.Media)
            .Where(p => p.TenantId == tenantId && p.Status == PropertyStatus.Published);

        if (!string.IsNullOrWhiteSpace(search.City))
            query = query.Where(p => EF.Functions.ILike(p.City, $"%{search.City}%"));
        if (!string.IsNullOrWhiteSpace(search.Neighborhood))
            query = query.Where(p => EF.Functions.ILike(p.Neighborhood, $"%{search.Neighborhood}%"));
        if (search.MaxPrice is not null)
            query = query.Where(p => p.Price <= search.MaxPrice);
        if (search.Bedrooms is not null)
            query = query.Where(p => p.Bedrooms >= search.Bedrooms);
        if (search.Operation is not null)
            query = query.Where(p => p.Operation == search.Operation);

        return await query.OrderByDescending(p => p.PublishedAt).Take(100).ToListAsync(ct);
    }

    private async Task<string> RenderCardsAsync(ThemeLocation location, IReadOnlyList<Property> properties, CancellationToken ct)
    {
        var cards = new List<string>();
        foreach (var property in properties)
        {
            var card = await themeRenderer.RenderPropertyCardAsync(location, new Dictionary<string, string>
            {
                ["property.id"] = property.Id.ToString(),
                ["property.title"] = property.Title,
                ["property.price"] = FormatPrice(property.Price, property.Operation),
                ["property.city"] = property.City,
                ["property.neighborhood"] = property.Neighborhood,
                ["property.bedrooms"] = property.Bedrooms.ToString(CultureInfo.InvariantCulture),
                ["property.operation"] = OperationLabel(property.Operation),
                ["property.operation_key"] = EnumMapper.ToApi(property.Operation),
                ["property.images"] = CoverUrl(property, location)
            }, ct);
            if (!string.IsNullOrWhiteSpace(card))
                cards.Add(card);
        }

        return string.Concat(cards);
    }

    private string CoverUrl(Property? property, ThemeLocation location)
    {
        var photo = property?.Media
            .Where(m => m.MediaType == PropertyMediaType.Photo)
            .OrderBy(m => m.SortOrder)
            .Select(m => storage.GetPublicUrl(m.Path))
            .FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(photo))
            return photo;

        var localHero = Path.Combine(location.RootDirectory, "assets", "img", "imovel-1.jpg");
        if (File.Exists(localHero))
            return $"/themes/{location.PublicAssetKey}/assets/img/imovel-1.jpg";

        return "/themes/moderno/assets/img/imovel-1.jpg";
    }

    private string GalleryHtml(Property? property, ThemeLocation location)
    {
        var urls = property?.Media
            .Where(m => m.MediaType == PropertyMediaType.Photo)
            .OrderBy(m => m.SortOrder)
            .Select(m => storage.GetPublicUrl(m.Path))
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .ToList() ?? [];

        if (urls.Count == 0)
            urls.Add(CoverUrl(property, location));

        var alt = WebUtility.HtmlEncode(property?.Title ?? "Imóvel");
        var thumbs = string.Join("", urls.Select((url, i) =>
            $"<button type=\"button\" aria-pressed=\"{(i == 0 ? "true" : "false")}\"><img src=\"{WebUtility.HtmlEncode(url)}\" alt=\"{alt}\" /></button>"));

        return $"<figure class=\"gallery__main\"><img src=\"{WebUtility.HtmlEncode(urls[0])}\" alt=\"{alt}\" /></figure>" +
               $"<div class=\"gallery__thumbs\" role=\"group\" aria-label=\"Miniaturas da galeria\">{thumbs}</div>";
    }

    private static string FormatPrice(decimal price, PropertyOperation operation)
    {
        var formatted = price.ToString("C0", CultureInfo.GetCultureInfo("pt-BR"));
        return operation == PropertyOperation.Rent ? $"{formatted}/mês" : formatted;
    }

    private static string OperationLabel(PropertyOperation operation) =>
        operation == PropertyOperation.Rent ? "Alugar" : "Comprar";

    private static string InjectRuntime(string html, object config)
    {
        var json = JsonSerializer.Serialize(config, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var snippet =
            "<script>window.ALLUGME_VITRINE=" + json + ";</script>" +
            "<script src=\"/themes/_platform/js/vitrine-runtime.js\" defer></script>";

        var idx = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        return idx >= 0
            ? html.Insert(idx, snippet)
            : html + snippet;
    }

    [GeneratedRegex(
        @"<(article|figure|div)[^>]*data-preview-only[^>]*>[\s\S]*?</\1>",
        RegexOptions.IgnoreCase)]
    private static partial Regex PreviewOnlyBlocks();
}
