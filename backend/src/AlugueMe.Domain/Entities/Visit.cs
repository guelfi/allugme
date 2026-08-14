using AlugueMe.Domain.Enums;

namespace AlugueMe.Domain.Entities;

public class Visit
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public Guid TenantId { get; set; }
    public Guid BrokerId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string VisitorPhone { get; set; } = string.Empty;
    public string? VisitorEmail { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public int BufferMinutesApplied { get; set; }
    public VisitStatus Status { get; set; } = VisitStatus.Pending;
    public string ConfirmationCode { get; set; } = string.Empty;
    public DateTime? NotifiedAt { get; set; }
    public ConfirmedVia? ConfirmedVia { get; set; }
    /// <summary>Conta do portal do cliente vinculada (quando o visitante está logado ou reivindicou a visita).</summary>
    public Guid? ClientUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? Reminder24hSentAt { get; set; }
    public DateTime? Reminder2hSentAt { get; set; }
    public DateTime? FeedbackRequestedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Property Property { get; set; } = null!;
    public Tenant Tenant { get; set; } = null!;
    public User Broker { get; set; } = null!;
    public User? ClientUser { get; set; }
    public VisitFeedback? Feedback { get; set; }
}
