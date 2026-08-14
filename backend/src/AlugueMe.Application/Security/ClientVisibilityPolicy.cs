using AlugueMe.Domain.Entities;

namespace AlugueMe.Application.Security;

public static class ClientVisibilityPolicy
{
    public static IQueryable<Visit> ScopeVisits(IQueryable<Visit> visits, Guid tenantId, string? role, Guid userId)
    {
        var scoped = visits.Where(v => v.TenantId == tenantId);
        return role == "broker" ? scoped.Where(v => v.BrokerId == userId) : scoped;
    }
}
