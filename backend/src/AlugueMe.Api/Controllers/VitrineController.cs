using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Themes;
using AlugueMe.Api.Pages;
using Microsoft.AspNetCore.Mvc;

namespace AlugueMe.Api.Controllers;

[ApiController]
public class VitrineController(
    IVitrineComposer composer,
    IConfiguration configuration) : ControllerBase
{
    [HttpGet("/t/{slug}/{page?}")]
    [HttpGet("/t/{slug}/{page}/{id:guid}")]
    public async Task<IActionResult> Page(string slug, string? page, Guid? id, CancellationToken ct)
    {
        page = string.IsNullOrWhiteSpace(page) ? "home" : page;
        page = page.EndsWith(".html", StringComparison.OrdinalIgnoreCase)
            ? page[..^5]
            : page.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(page))
            page = "home";

        var queryPairs = Request.Query.SelectMany(kvp =>
            kvp.Value.Select(v => new KeyValuePair<string, string?>(kvp.Key, v)));
        var propertyId = id ?? ThemeSearchQuery.ParsePropertyId(queryPairs);
        var search = ThemeSearchQuery.From(queryPairs);

        var result = await composer.ComposeAsync(new VitrineComposeRequest(slug, page, propertyId, search), ct);
        if (result.StatusCode == 404)
        {
            var marketingBaseUrl = configuration["App:MarketingBaseUrl"] ?? "https://allugme.online";
            return new ContentResult
            {
                Content = VitrineNotFoundPage.Render(marketingBaseUrl),
                ContentType = "text/html; charset=utf-8",
                StatusCode = StatusCodes.Status404NotFound
            };
        }

        return Content(result.Html, "text/html; charset=utf-8");
    }
}
