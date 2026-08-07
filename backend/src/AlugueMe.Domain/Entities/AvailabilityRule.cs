namespace AlugueMe.Domain.Entities;

/// <summary>
/// Horário de funcionamento por dia da semana.
/// BrokerUserId preenchido = regra do corretor; senão = regra do tenant.
/// </summary>
public class AvailabilityRule
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? BrokerUserId { get; set; }
    /// <summary>0 = Sunday … 6 = Saturday (mesmo que <see cref="DayOfWeek"/>).</summary>
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; } = new(9, 0);
    public TimeOnly EndTime { get; set; } = new(18, 0);
    public bool IsClosed { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User? Broker { get; set; }
}
