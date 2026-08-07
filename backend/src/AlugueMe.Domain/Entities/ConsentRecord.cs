namespace AlugueMe.Domain.Entities;

public class ConsentRecord
{
    public Guid Id { get; set; }
    /// <summary>register_b2b | visit_booking | register_client</summary>
    public string Context { get; set; } = string.Empty;
    public string PolicyVersion { get; set; } = "1.0";
    public string SubjectEmail { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public Guid? VisitId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
}
