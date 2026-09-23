using System.Net;
using System.Text.RegularExpressions;

namespace AlugueMe.Infrastructure.Themes;

/// <summary>
/// Favicon oficial da plataforma nas vitrines. Temas oficiais e a LP usam o mesmo
/// desenho; o admin poderá trocar por tenant depois via <c>tenant.favicon_url</c>.
/// </summary>
public static partial class VitrineFavicon
{
    public const string PlatformHref = "/themes/_platform/favicon.svg";

    public static string Ensure(string html, string? href = null)
    {
        if (string.IsNullOrWhiteSpace(html) || HasIconLink(html))
            return html;

        var url = string.IsNullOrWhiteSpace(href) ? PlatformHref : href.Trim();
        var tag = $"<link rel=\"icon\" type=\"image/svg+xml\" href=\"{WebUtility.HtmlEncode(url)}\" />";
        var idx = html.IndexOf("</head>", StringComparison.OrdinalIgnoreCase);
        return idx >= 0 ? html.Insert(idx, tag) : html;
    }

    public static bool HasIconLink(string html) =>
        !string.IsNullOrEmpty(html) && IconRel().IsMatch(html);

    [GeneratedRegex(@"<link\b[^>]*\brel\s*=\s*[""'](?:shortcut\s+)?icon[""']", RegexOptions.IgnoreCase)]
    private static partial Regex IconRel();
}
