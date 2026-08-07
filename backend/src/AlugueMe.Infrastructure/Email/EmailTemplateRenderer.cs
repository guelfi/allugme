using System.Net;
using System.Text.RegularExpressions;
using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Email;

public partial class EmailTemplateRenderer(
    IOptions<ThemesOptions> themesOptions,
    IOptions<StorageOptions> storageOptions,
    ILogger<EmailTemplateRenderer> logger) : IEmailTemplateRenderer
{
    private readonly ThemesOptions _themes = themesOptions.Value;
    private readonly StorageOptions _storage = storageOptions.Value;

    /// <summary>Cores de marca alinhadas aos temas oficiais (tokens da vitrine).</summary>
    private static readonly IReadOnlyDictionary<string, (string Brand, string Accent, string Soft)> ThemePalette =
        new Dictionary<string, (string, string, string)>(StringComparer.OrdinalIgnoreCase)
        {
            ["moderno"] = ("#0b3d91", "#00a3a1", "#e8eefb"),
            ["urbano"] = ("#2d4eb9", "#2d4eb9", "#e8eefc"),
            ["classico"] = ("#1f3d2b", "#c4a35a", "#f7f5f2"),
            ["minimal"] = ("#111111", "#6b7f4a", "#eef2e6"),
            ["porto"] = ("#1b2a4a", "#2a3f6b", "#e7f2ef"),
        };

    public async Task<string> RenderAsync(
        string templateKey,
        string? themeKey,
        Guid? tenantId,
        IReadOnlyDictionary<string, string> placeholders,
        CancellationToken cancellationToken = default)
    {
        var path = ResolveTemplatePath(templateKey, themeKey, tenantId);
        if (path is null)
            throw new FileNotFoundException($"Email template not found: {templateKey}");

        logger.LogDebug("Email template {Key} resolved to {Path}", templateKey, path);
        var html = await File.ReadAllTextAsync(path, cancellationToken);

        var merged = new Dictionary<string, string>(placeholders, StringComparer.OrdinalIgnoreCase);
        ApplyThemeDefaults(merged, themeKey);

        // {{{key}}} = raw (URLs em href); {{key}} = HTML-encoded
        foreach (var (key, value) in merged)
            html = html.Replace("{{{" + key + "}}}", value ?? string.Empty, StringComparison.OrdinalIgnoreCase);

        html = EncodedPlaceholder().Replace(html, m =>
        {
            var name = m.Groups["name"].Value;
            return merged.TryGetValue(name, out var v)
                ? WebUtility.HtmlEncode(v ?? string.Empty)
                : m.Value;
        });

        return html;
    }

    private string? ResolveTemplatePath(string templateKey, string? themeKey, Guid? tenantId)
    {
        var fileName = $"{templateKey}.html";
        var themesRoot = Path.GetFullPath(_themes.RootPath);
        var storageRoot = Path.GetFullPath(
            string.IsNullOrWhiteSpace(_storage.EmailTemplatesPath)
                ? "storage/email-templates"
                : _storage.EmailTemplatesPath);

        if (tenantId.HasValue)
        {
            var tenantPath = Path.Combine(storageRoot, tenantId.Value.ToString("D"), fileName);
            if (File.Exists(tenantPath))
                return tenantPath;
        }

        if (!string.IsNullOrWhiteSpace(themeKey))
        {
            var themePath = Path.Combine(themesRoot, themeKey, "emails", fileName);
            if (File.Exists(themePath))
                return themePath;
        }

        var platformPath = Path.Combine(themesRoot, "_platform", "emails", fileName);
        return File.Exists(platformPath) ? platformPath : null;
    }

    private static void ApplyThemeDefaults(Dictionary<string, string> placeholders, string? themeKey)
    {
        var key = string.IsNullOrWhiteSpace(themeKey) ? "moderno" : themeKey;
        if (!ThemePalette.TryGetValue(key, out var palette))
            palette = ThemePalette["moderno"];

        placeholders.TryAdd("brand_color", palette.Brand);
        placeholders.TryAdd("accent_color", palette.Accent);
        placeholders.TryAdd("soft_color", palette.Soft);
        placeholders.TryAdd("theme_key", key);
        placeholders.TryAdd("platform_name", "Allugme");
        placeholders.TryAdd("year", DateTime.UtcNow.Year.ToString());
    }

    [GeneratedRegex(@"\{\{(?<name>[a-zA-Z0-9_.-]+)\}\}", RegexOptions.Compiled)]
    private static partial Regex EncodedPlaceholder();
}
