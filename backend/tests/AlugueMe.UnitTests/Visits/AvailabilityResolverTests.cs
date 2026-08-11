using AlugueMe.Application.Visits;
using AlugueMe.Domain.Entities;

namespace AlugueMe.UnitTests.Visits;

public class AvailabilityResolverTests
{
    [Fact]
    public void Resolve_uses_broker_rule_before_tenant_rule()
    {
        var brokerRules = new[] { Rule(DayOfWeek.Monday, 10, 16) };
        var tenantRules = new[] { Rule(DayOfWeek.Monday, 8, 19) };

        var result = AvailabilityResolver.Resolve(DayOfWeek.Monday, brokerRules, tenantRules);

        Assert.False(result.IsClosed);
        Assert.Equal(new TimeOnly(10, 0), result.Start);
        Assert.Equal(new TimeOnly(16, 0), result.End);
    }

    [Fact]
    public void Resolve_uses_tenant_rule_when_broker_has_no_rule_for_day()
    {
        var brokerRules = new[] { Rule(DayOfWeek.Tuesday, 10, 16) };
        var tenantRules = new[] { Rule(DayOfWeek.Monday, 8, 19) };

        var result = AvailabilityResolver.Resolve(DayOfWeek.Monday, brokerRules, tenantRules);

        Assert.False(result.IsClosed);
        Assert.Equal(new TimeOnly(8, 0), result.Start);
        Assert.Equal(new TimeOnly(19, 0), result.End);
    }

    [Theory]
    [InlineData(DayOfWeek.Saturday)]
    [InlineData(DayOfWeek.Sunday)]
    public void Resolve_closes_weekends_by_default(DayOfWeek day)
    {
        var result = AvailabilityResolver.Resolve(day, [], []);

        Assert.True(result.IsClosed);
    }

    [Fact]
    public void Resolve_honors_explicit_closed_broker_rule()
    {
        var closed = Rule(DayOfWeek.Monday, 9, 18);
        closed.IsClosed = true;

        var result = AvailabilityResolver.Resolve(DayOfWeek.Monday, [closed], []);

        Assert.True(result.IsClosed);
    }

    private static AvailabilityRule Rule(DayOfWeek day, int startHour, int endHour) => new()
    {
        DayOfWeek = (int)day,
        StartTime = new TimeOnly(startHour, 0),
        EndTime = new TimeOnly(endHour, 0)
    };
}
