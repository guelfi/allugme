namespace AlugueMe.Domain.Entities;

public class PropertyMedia
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public string Path { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Property Property { get; set; } = null!;
}
