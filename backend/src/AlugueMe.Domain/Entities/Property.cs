using AlugueMe.Domain.Enums;

namespace AlugueMe.Domain.Entities;

public class Property
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ResponsibleBrokerId { get; set; }
    public PropertyOperation Operation { get; set; }
    public PropertyStatus Status { get; set; } = PropertyStatus.Draft;
    public PropertyType PropertyType { get; set; } = PropertyType.Apartment;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Bedrooms { get; set; }
    public decimal AreaSqm { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User ResponsibleBroker { get; set; } = null!;
    public ICollection<PropertyMedia> Media { get; set; } = [];
    public ICollection<Visit> Visits { get; set; } = [];
}
