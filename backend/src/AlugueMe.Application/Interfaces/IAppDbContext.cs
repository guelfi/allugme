using AlugueMe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<TenantMembership> TenantMemberships { get; }
    DbSet<Property> Properties { get; }
    DbSet<PropertyMedia> PropertyMedia { get; }
    DbSet<TenantSettings> TenantSettings { get; }
    DbSet<BrokerSettings> BrokerSettings { get; }
    DbSet<CalendarBlock> CalendarBlocks { get; }
    DbSet<Visit> Visits { get; }
    DbSet<WhatsAppOutboundLog> WhatsAppOutboundLogs { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<BrokerInviteToken> BrokerInviteTokens { get; }
    DbSet<AvailabilityRule> AvailabilityRules { get; }
    DbSet<ConsentRecord> ConsentRecords { get; }
    DbSet<FavoriteProperty> FavoriteProperties { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
