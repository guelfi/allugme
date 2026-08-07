using AlugueMe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Application.Visits;

public static class AvailabilityResolver
{
    public static readonly TimeOnly DefaultStart = new(9, 0);
    public static readonly TimeOnly DefaultEnd = new(18, 0);

    /// <summary>
    /// Precedência: regras do corretor (se houver alguma para o tenant) → regras do tenant → padrão 09–18 úteis.
    /// </summary>
    public static (bool IsClosed, TimeOnly Start, TimeOnly End) Resolve(
        DayOfWeek day,
        IReadOnlyList<AvailabilityRule> brokerRules,
        IReadOnlyList<AvailabilityRule> tenantRules)
    {
        var dow = (int)day;
        var brokerDay = brokerRules.Where(r => r.DayOfWeek == dow).ToList();
        if (brokerDay.Count > 0)
        {
            var rule = brokerDay[0];
            return rule.IsClosed
                ? (true, DefaultStart, DefaultEnd)
                : (false, rule.StartTime, rule.EndTime);
        }

        var tenantDay = tenantRules.Where(r => r.DayOfWeek == dow).ToList();
        if (tenantDay.Count > 0)
        {
            var rule = tenantDay[0];
            return rule.IsClosed
                ? (true, DefaultStart, DefaultEnd)
                : (false, rule.StartTime, rule.EndTime);
        }

        // Padrão: sábado/domingo fechado; úteis 09–18
        if (day is DayOfWeek.Saturday or DayOfWeek.Sunday)
            return (true, DefaultStart, DefaultEnd);

        return (false, DefaultStart, DefaultEnd);
    }

    public static async Task<(bool IsClosed, TimeOnly Start, TimeOnly End)> ResolveAsync(
        DbContext db,
        Guid tenantId,
        Guid brokerUserId,
        DayOfWeek day,
        CancellationToken ct)
    {
        var all = await db.Set<AvailabilityRule>()
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId && (r.BrokerUserId == null || r.BrokerUserId == brokerUserId))
            .ToListAsync(ct);

        var brokerRules = all.Where(r => r.BrokerUserId == brokerUserId).ToList();
        var tenantRules = all.Where(r => r.BrokerUserId == null).ToList();
        return Resolve(day, brokerRules, tenantRules);
    }
}
