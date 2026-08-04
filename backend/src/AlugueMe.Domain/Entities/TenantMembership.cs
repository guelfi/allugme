using AlugueMe.Domain.Enums;

namespace AlugueMe.Domain.Entities;

public class TenantMembership
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public MembershipRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Tenant Tenant { get; set; } = null!;
}
