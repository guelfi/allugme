namespace AlugueMe.Domain.Entities;

public class VisitFeedback
{
    public Guid Id { get; set; }
    public Guid VisitId { get; set; }
    public Guid ClientUserId { get; set; }
    public int OverallRating { get; set; }
    public int BrokerRating { get; set; }
    public string InterestLevel { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public bool WantsContact { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Visit Visit { get; set; } = null!;
    public User ClientUser { get; set; } = null!;
}
