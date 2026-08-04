namespace AlugueMe.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsSaasAdmin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TenantMembership> Memberships { get; set; } = [];
    public ICollection<BrokerSettings> BrokerSettings { get; set; } = [];
    public ICollection<Property> ResponsibleProperties { get; set; } = [];
    public ICollection<CalendarBlock> CalendarBlocks { get; set; } = [];
    public ICollection<Visit> Visits { get; set; } = [];
}
