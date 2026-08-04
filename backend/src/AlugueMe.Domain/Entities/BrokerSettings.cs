namespace AlugueMe.Domain.Entities;

public class BrokerSettings
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public int? BufferMinutes { get; set; }
    public int? VisitDurationMinutes { get; set; }
    public string? WhatsAppE164 { get; set; }
    public bool? WhatsAppNotifyEnabled { get; set; }

    public User User { get; set; } = null!;
    public Tenant Tenant { get; set; } = null!;
}
