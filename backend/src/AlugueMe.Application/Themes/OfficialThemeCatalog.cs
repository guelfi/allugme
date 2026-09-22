namespace AlugueMe.Application.Themes;

public static class OfficialThemeCatalog
{
    public static readonly IReadOnlyList<string> Keys = ["moderno", "urbano", "classico", "minimal", "porto"];

    public static bool IsOfficial(string? themeKey) =>
        !string.IsNullOrWhiteSpace(themeKey) &&
        Keys.Contains(themeKey.Trim(), StringComparer.OrdinalIgnoreCase);

    public static bool TryParseCustomKey(string? themeKey, out Guid submissionId)
    {
        submissionId = Guid.Empty;
        if (string.IsNullOrWhiteSpace(themeKey))
            return false;

        const string prefix = "custom:";
        var value = themeKey.Trim();
        if (!value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        return Guid.TryParseExact(value[prefix.Length..], "N", out submissionId)
            || Guid.TryParse(value[prefix.Length..], out submissionId);
    }
}
