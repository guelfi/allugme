namespace AlugueMe.Application.Common;

/// <summary>
/// Slugs que não podem ser tenants porque colidem com rotas na raiz do domínio (/{slug}).
/// </summary>
public static class ReservedTenantSlugs
{
    private static readonly HashSet<string> Reserved = new(StringComparer.OrdinalIgnoreCase)
    {
        "allugme", "api", "swagger", "themes", "media", "health", "admin", "www",
        "login", "register", "assets", "static", "favicon.ico", "robots.txt",
        "driverhub", "hako", "unisystem", "batuara", "bela360", "barbear"
    };

    public static bool IsReserved(string? slug) =>
        !string.IsNullOrWhiteSpace(slug) && Reserved.Contains(slug.Trim());
}
