using AlugueMe.Application.Security;
using AlugueMe.Domain.Entities;

namespace AlugueMe.UnitTests.Security;

public class ClientVisibilityPolicyTests
{
    [Fact]
    public void Agency_admin_only_sees_visits_from_own_tenant()
    {
        var tenantA = Guid.NewGuid(); var tenantB = Guid.NewGuid();
        var visits = new[] { Visit(tenantA, Guid.NewGuid()), Visit(tenantB, Guid.NewGuid()) }.AsQueryable();
        var result = ClientVisibilityPolicy.ScopeVisits(visits, tenantA, "agency_admin", Guid.NewGuid()).ToList();
        Assert.Single(result);
        Assert.Equal(tenantA, result[0].TenantId);
    }

    [Fact]
    public void Affiliated_broker_only_sees_own_visits_inside_tenant()
    {
        var tenant = Guid.NewGuid(); var broker = Guid.NewGuid();
        var visits = new[] { Visit(tenant, broker), Visit(tenant, Guid.NewGuid()), Visit(Guid.NewGuid(), broker) }.AsQueryable();
        var result = ClientVisibilityPolicy.ScopeVisits(visits, tenant, "broker", broker).ToList();
        Assert.Single(result);
        Assert.Equal(broker, result[0].BrokerId);
        Assert.Equal(tenant, result[0].TenantId);
    }

    private static Visit Visit(Guid tenantId, Guid brokerId) => new() { Id = Guid.NewGuid(), TenantId = tenantId, BrokerId = brokerId };
}
