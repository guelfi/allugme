namespace AlugueMe.Domain.Entities;

public class WhatsAppOutboundLog
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? VisitId { get; set; }
    public string ToE164 { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
