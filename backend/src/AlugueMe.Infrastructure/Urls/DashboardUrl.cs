using AlugueMe.Infrastructure.Security;

namespace AlugueMe.Infrastructure.Urls;

/// <summary>
/// Resolve a base do painel. Em Production (e em workers sem request) usa a
/// config canônica — o Host da API é api.allugme.online, não o painel.
/// Em Development, se o Host for loopback/RFC1918, deriva scheme+host+PublicBasePath.
/// </summary>
public static class DashboardUrl
{
    public static string Resolve(
        string configured,
        bool isDevelopment,
        string? scheme,
        string? hostHeader,
        string? publicBasePath)
    {
        var fallback = (configured ?? string.Empty).TrimEnd('/');
        if (!isDevelopment)
            return fallback;
        if (string.IsNullOrWhiteSpace(hostHeader))
            return fallback;
        if (!Uri.TryCreate($"http://{hostHeader.Trim()}", UriKind.Absolute, out var hostUri))
            return fallback;
        if (!PrivateNetwork.IsPrivateOrLoopbackHost(hostUri.Host))
            return fallback;

        var normalizedScheme = NormalizeScheme(scheme);
        var path = (publicBasePath ?? string.Empty).TrimEnd('/');
        return $"{normalizedScheme}://{hostHeader.Trim().TrimEnd('/')}{path}";
    }

    internal static string NormalizeScheme(string? scheme)
    {
        if (string.IsNullOrWhiteSpace(scheme))
            return "http";
        var first = scheme.Split(',')[0].Trim().ToLowerInvariant();
        return first is "http" or "https" ? first : "http";
    }
}
