using System.Net;
using System.Net.Sockets;

namespace AlugueMe.Infrastructure.Security;

/// <summary>
/// Loopback e RFC1918. Usado no CORS de Development e para validar Host
/// antes de derivar App:DashboardBaseUrl no ambiente local.
/// </summary>
public static class PrivateNetwork
{
    public static bool IsAllowedDevelopmentOrigin(string? origin)
    {
        if (string.IsNullOrWhiteSpace(origin))
            return false;
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            return false;
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            return false;
        return IsPrivateOrLoopbackHost(uri.Host);
    }

    public static bool IsPrivateOrLoopbackHost(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return false;
        if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
            return true;
        if (!IPAddress.TryParse(host, out var ip))
            return false;
        if (ip.IsIPv4MappedToIPv6)
            ip = ip.MapToIPv4();
        if (IPAddress.IsLoopback(ip))
            return true;
        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = ip.GetAddressBytes();
            if (b[0] == 10)
                return true;
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
                return true;
            if (b[0] == 192 && b[1] == 168)
                return true;
            return false;
        }

        if (ip.AddressFamily == AddressFamily.InterNetworkV6)
        {
            var b = ip.GetAddressBytes();
            return (b[0] & 0xfe) == 0xfc;
        }

        return false;
    }
}
