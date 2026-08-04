using System.Net;
using System.Text.RegularExpressions;
using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Themes;

public partial class ThemeRenderer(IOptions<ThemesOptions> options) : IThemeRenderer
{
    private readonly ThemesOptions _options = options.Value;

    public async Task<string> RenderPageAsync(string themeKey, string pageName, Dictionary<string, string> placeholders, CancellationToken cancellationToken = default)
    {
        var root = Path.GetFullPath(_options.RootPath);
        var pagePath = Path.Combine(root, themeKey, "pages", $"{pageName}.html");
        if (!File.Exists(pagePath))
            pagePath = Path.Combine(root, themeKey, "index.html");

        if (!File.Exists(pagePath))
            throw new FileNotFoundException($"Theme page not found: {themeKey}/{pageName}");

        var html = await File.ReadAllTextAsync(pagePath, cancellationToken);
        html = await IncludePartialsAsync(html, Path.GetDirectoryName(pagePath)!, cancellationToken);

        foreach (var (key, value) in placeholders)
            html = html.Replace($"{{{{{key}}}}}", WebUtility.HtmlEncode(value));

        html = PartialComment().Replace(html, string.Empty);
        return html;
    }

    private async Task<string> IncludePartialsAsync(string html, string pageDir, CancellationToken cancellationToken)
    {
        var themeDir = Directory.GetParent(pageDir)?.Parent?.FullName;
        if (themeDir is null)
            return html;

        var matches = PartialComment().Matches(html);
        foreach (Match match in matches)
        {
            var partialName = match.Groups[1].Value.Trim();
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
}
