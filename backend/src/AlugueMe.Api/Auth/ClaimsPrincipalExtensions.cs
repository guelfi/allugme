using System.Security.Claims;

namespace AlugueMe.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return Guid.Parse(sub!);
    }

    public static Guid? GetTenantId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("tenant_id");
        return value is null ? null : Guid.Parse(value);
    }

    public static bool IsSaasAdmin(this ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue("is_saas_admin"), "true", StringComparison.OrdinalIgnoreCase);

    public static bool IsClient(this ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue("is_client"), "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(user.FindFirstValue(ClaimTypes.Role), "client", StringComparison.OrdinalIgnoreCase);

    public static string? GetRole(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Role);
}
