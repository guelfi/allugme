using AlugueMe.Domain.Enums;

namespace AlugueMe.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public TenantType Type { get; set; }
    public TenantStatus Status { get; set; } = TenantStatus.Active;
    public string ThemeKey { get; set; } = "moderno";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TenantMembership> Memberships { get; set; } = [];
    public ICollection<Property> Properties { get; set; } = [];
    public TenantSettings? Settings { get; set; }
    public ICollection<Visit> Visits { get; set; } = [];
}
