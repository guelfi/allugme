namespace AlugueMe.Domain.Entities;

public class FavoriteProperty
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PropertyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Property Property { get; set; } = null!;
}
