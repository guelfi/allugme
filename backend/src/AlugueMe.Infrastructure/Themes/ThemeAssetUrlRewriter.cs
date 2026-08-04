using System.Text.RegularExpressions;

namespace AlugueMe.Infrastructure.Themes;

/// <summary>
/// Temas usam paths relativos (../assets/...). Sob /allugme/t/{slug}/ isso aponta para
/// /allugme/t/assets/... — inexistente. Reescreve para /{base}/themes/{themeKey}/assets/...
/// </summary>
public static partial class ThemeAssetUrlRewriter
{
    public static string Rewrite(string html, string themeKey, string? publicBasePath)
    {
        if (string.IsNullOrWhiteSpace(html) || string.IsNullOrWhiteSpace(themeKey))
            return html;

        var basePath = (publicBasePath ?? string.Empty).TrimEnd('/');
        var assetsPrefix = string.IsNullOrEmpty(basePath)
            ? $"/themes/{themeKey}/assets/"
            : $"{basePath}/themes/{themeKey}/assets/";

        // ../assets/  →  /allugme/themes/{key}/assets/
        html = RelativeParentAssets().Replace(html, assetsPrefix);
        // href/src="assets/..." (ex.: index.html na raiz do tema)
        html = RootRelativeAssets().Replace(html, assetsPrefix);

        return html;
    }

    [GeneratedRegex(@"\.\./assets/", RegexOptions.IgnoreCase)]
    private static partial Regex RelativeParentAssets();

    [GeneratedRegex(@"(?<=(?:href|src)=[""'])assets/", RegexOptions.IgnoreCase)]
    private static partial Regex RootRelativeAssets();
}
