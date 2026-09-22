using System.IO.Compression;
using System.Text.Json;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Themes;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Themes;

public class CustomThemePackage(IOptions<ThemesOptions> options) : ICustomThemePackage
{
    private readonly ThemesOptions _options = options.Value;

    public async Task<CustomThemePackageResult> StorePendingAsync(
        Guid tenantId,
        Guid submissionId,
        int version,
        string originalFileName,
        Stream zipContent,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        if (zipContent.CanSeek)
            zipContent.Position = 0;

        if (zipContent.CanSeek && zipContent.Length > ThemeModelRules.MaxPackageBytes)
            return new CustomThemePackageResult("", ["O pacote excede 8 MB."]);

        var folder = Path.Combine("_pending", tenantId.ToString("N"), submissionId.ToString("N"));
        var target = GetPendingDirectory(folder);
        if (Directory.Exists(target))
            Directory.Delete(target, true);
        Directory.CreateDirectory(target);

        try
        {
            using var archive = new ZipArchive(zipContent, ZipArchiveMode.Read, leaveOpen: true);
            var names = new List<string>();
            foreach (var entry in archive.Entries)
            {
                if (string.IsNullOrWhiteSpace(entry.Name))
                    continue;

                var relative = NormalizeEntryPath(entry.FullName);
                if (relative is null)
                {
                    errors.Add($"Caminho inválido no ZIP: {entry.FullName}");
                    continue;
                }

                var ext = Path.GetExtension(relative);
                if (!ThemeModelRules.AllowedExtensions.Contains(ext))
                {
                    errors.Add($"Extensão não permitida: {relative}");
                    continue;
                }

                names.Add(relative.Replace('\\', '/'));
                var dest = Path.Combine(target, relative);
                Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
                entry.ExtractToFile(dest, overwrite: true);
            }

            foreach (var required in ThemeModelRules.RequiredFiles)
            {
                if (!names.Any(n => n.Equals(required, StringComparison.OrdinalIgnoreCase)))
                    errors.Add($"Arquivo obrigatório ausente: {required}");
            }

            var themeJsonPath = Path.Combine(target, "theme.json");
            if (File.Exists(themeJsonPath))
                ValidateThemeJson(await File.ReadAllTextAsync(themeJsonPath, cancellationToken), errors);
        }
        catch (InvalidDataException)
        {
            errors.Add("O arquivo enviado não é um ZIP válido.");
        }

        if (errors.Count > 0)
        {
            if (Directory.Exists(target))
                Directory.Delete(target, true);
            return new CustomThemePackageResult("", errors);
        }

        _ = originalFileName;
        _ = version;
        return new CustomThemePackageResult(folder, []);
    }

    public string GetPendingDirectory(string storageFolder)
    {
        var root = CustomRoot();
        return Path.GetFullPath(Path.Combine(root, storageFolder));
    }

    public string GetApprovedDirectory(Guid tenantId, int version)
    {
        var root = CustomRoot();
        return Path.GetFullPath(Path.Combine(root, tenantId.ToString("N"), version.ToString()));
    }

    private string CustomRoot()
    {
        if (!string.IsNullOrWhiteSpace(_options.CustomRootPath))
            return Path.GetFullPath(_options.CustomRootPath);

        return Path.GetFullPath(Path.Combine(_options.RootPath, "..", "custom"));
    }

    private static string? NormalizeEntryPath(string fullName)
    {
        var trimmed = fullName.Replace('\\', '/').TrimStart('/');
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.Contains("..", StringComparison.Ordinal))
            return null;

        var firstSlash = trimmed.IndexOf('/');
        if (firstSlash > 0 && !ThemeModelRules.RequiredFiles.Any(f => trimmed.Equals(f, StringComparison.OrdinalIgnoreCase) || trimmed.StartsWith(f.Split('/')[0] + "/", StringComparison.OrdinalIgnoreCase)))
        {
            var withoutRoot = trimmed[(firstSlash + 1)..];
            if (ThemeModelRules.RequiredFiles.Any(f => withoutRoot.Equals(f, StringComparison.OrdinalIgnoreCase)
                || withoutRoot.StartsWith("pages/", StringComparison.OrdinalIgnoreCase)
                || withoutRoot.StartsWith("partials/", StringComparison.OrdinalIgnoreCase)
                || withoutRoot.StartsWith("assets/", StringComparison.OrdinalIgnoreCase)
                || withoutRoot.Equals("theme.json", StringComparison.OrdinalIgnoreCase)))
            {
                trimmed = withoutRoot;
            }
        }

        return trimmed.Replace('/', Path.DirectorySeparatorChar);
    }

    private static void ValidateThemeJson(string json, List<string> errors)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("pages", out var pages) || pages.ValueKind != JsonValueKind.Array)
            {
                errors.Add("theme.json precisa listar as páginas obrigatórias.");
                return;
            }

            var listed = pages.EnumerateArray()
                .Select(p => p.GetString()?.Trim().ToLowerInvariant())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToHashSet();

            foreach (var page in ThemeModelRules.RequiredPages)
            {
                if (!listed.Contains(page))
                    errors.Add($"theme.json não declara a página '{page}'.");
            }
        }
        catch (JsonException)
        {
            errors.Add("theme.json inválido.");
        }
    }
}
