namespace AlugueMe.Domain.Entities;

public class CalendarBlock
{
    public Guid Id { get; set; }
    public Guid BrokerId { get; set; }
    public Guid TenantId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Broker { get; set; } = null!;
}
