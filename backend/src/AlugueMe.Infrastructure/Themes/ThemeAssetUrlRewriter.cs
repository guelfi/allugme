using System.Text.RegularExpressions;

namespace AlugueMe.Infrastructure.Themes;

/// <summary>
/// Temas usam paths relativos (../assets/...). Na vitrine em /{slug}/ isso apontaria para
/// /assets/... — inexistente. Reescreve para /themes/{themeKey}/assets/...
/// </summary>
public static partial class ThemeAssetUrlRewriter
{
    /// <param name="themesBasePath">
    /// Prefixo público dos assets (vazio → /themes/...). Em geral a vitrine usa a raiz do host.
    /// </param>
    public static string Rewrite(string html, string themeKey, string? themesBasePath = "")
    {
        if (string.IsNullOrWhiteSpace(html) || string.IsNullOrWhiteSpace(themeKey))
            return html;

        var basePath = (themesBasePath ?? string.Empty).TrimEnd('/');
        var assetsPrefix = string.IsNullOrEmpty(basePath)
            ? $"/themes/{themeKey}/assets/"
            : $"{basePath}/themes/{themeKey}/assets/";

        // ../assets/  →  /themes/{key}/assets/
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
