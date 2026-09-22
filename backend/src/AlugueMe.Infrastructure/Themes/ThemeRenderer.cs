using System.Net;
using System.Text.RegularExpressions;
using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Themes;

public partial class ThemeRenderer(IOptions<ThemesOptions> options) : IThemeRenderer
{
    private readonly ThemesOptions _options = options.Value;

    public Task<string> RenderPageAsync(string themeKey, string pageName, Dictionary<string, string> placeholders, CancellationToken cancellationToken = default)
    {
        var root = Path.GetFullPath(_options.RootPath);
        var location = new ThemeLocation(themeKey, Path.Combine(root, themeKey), true);
        return RenderPageAsync(location, pageName, placeholders, null, cancellationToken);
    }

    public async Task<string> RenderPageAsync(
        ThemeLocation location,
        string pageName,
        Dictionary<string, string> placeholders,
        IReadOnlySet<string>? rawKeys,
        CancellationToken cancellationToken = default)
    {
        var pagePath = Path.Combine(location.RootDirectory, "pages", $"{pageName}.html");
        if (!File.Exists(pagePath))
            pagePath = Path.Combine(location.RootDirectory, "index.html");

        if (!File.Exists(pagePath))
            throw new FileNotFoundException($"Theme page not found: {location.PublicAssetKey}/{pageName}");

        var html = await File.ReadAllTextAsync(pagePath, cancellationToken);
        html = await IncludePartialsAsync(html, Path.GetDirectoryName(pagePath)!, cancellationToken);
        html = PreviewOnlyBlocks().Replace(html, string.Empty);
        html = ApplyPlaceholders(html, placeholders, rawKeys);
        html = PartialComment().Replace(html, string.Empty);
        return html;
    }

    public async Task<string> RenderPropertyCardAsync(
        ThemeLocation location,
        Dictionary<string, string> placeholders,
        CancellationToken cancellationToken = default)
    {
        var cardPath = Path.Combine(location.RootDirectory, "partials", "property-card.html");
        if (!File.Exists(cardPath))
            return string.Empty;

        var html = await File.ReadAllTextAsync(cardPath, cancellationToken);
        html = ApplyPlaceholders(html, placeholders, rawKeys: null);

        if (placeholders.TryGetValue("property.id", out var id) && !string.IsNullOrWhiteSpace(id))
        {
            html = html.Replace("href=\"property.html\"", $"href=\"property.html?id={id}\"", StringComparison.OrdinalIgnoreCase);
            html = html.Replace("href='property.html'", $"href='property.html?id={id}'", StringComparison.OrdinalIgnoreCase);
            if (html.Contains("<article", StringComparison.OrdinalIgnoreCase) && !html.Contains("data-property-id", StringComparison.OrdinalIgnoreCase))
                html = ArticleOpen().Replace(html, $"<article data-property-id=\"{WebUtility.HtmlEncode(id)}\" ", 1);
        }

        if (placeholders.TryGetValue("property.operation_key", out var opKey) &&
            string.Equals(opKey, "sale", StringComparison.OrdinalIgnoreCase))
        {
            html = html.Replace("badge--alugar", "badge--comprar");
        }

        return html;
    }

    private static string ApplyPlaceholders(
        string html,
        Dictionary<string, string> placeholders,
        IReadOnlySet<string>? rawKeys)
    {
        foreach (var (key, value) in placeholders)
        {
            var token = "{{" + key + "}}";
            var encoded = rawKeys is not null && rawKeys.Contains(key)
                ? value ?? string.Empty
                : WebUtility.HtmlEncode(value ?? string.Empty);
            html = html.Replace(token, encoded);
        }

        return html;
    }

    private async Task<string> IncludePartialsAsync(string html, string pageDir, CancellationToken cancellationToken)
    {
        var themeDir = Directory.GetParent(pageDir)?.FullName;
        if (themeDir is null)
            return html;

        var matches = PartialComment().Matches(html);
        foreach (Match match in matches)
        {
            var partialName = match.Groups["name"].Value.Trim();
            var partialPath = Path.Combine(themeDir, "partials", $"{partialName}.html");
            if (!File.Exists(partialPath))
                continue;

            var partialHtml = await File.ReadAllTextAsync(partialPath, cancellationToken);
            html = html.Replace(match.Value, partialHtml);
        }

        return html;
    }

    [GeneratedRegex(@"<!--\s*partial:(?<name>[\w-]+)\s*-->", RegexOptions.IgnoreCase)]
    private static partial Regex PartialComment();

    [GeneratedRegex(@"<article\s+", RegexOptions.IgnoreCase)]
    private static partial Regex ArticleOpen();

    [GeneratedRegex(
        @"<(article|figure|div)[^>]*data-preview-only[^>]*>[\s\S]*?</\1>",
        RegexOptions.IgnoreCase)]
    private static partial Regex PreviewOnlyBlocks();
}
