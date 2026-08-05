using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TenantMembership> TenantMemberships => Set<TenantMembership>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyMedia> PropertyMedia => Set<PropertyMedia>();
    public DbSet<TenantSettings> TenantSettings => Set<TenantSettings>();
    public DbSet<BrokerSettings> BrokerSettings => Set<BrokerSettings>();
    public DbSet<CalendarBlock> CalendarBlocks => Set<CalendarBlock>();
    public DbSet<Visit> Visits => Set<Visit>();
    public DbSet<WhatsAppOutboundLog> WhatsAppOutboundLogs => Set<WhatsAppOutboundLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.AvatarPath).HasMaxLength(300);
        });

        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Slug).HasMaxLength(100);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.ThemeKey).HasMaxLength(50);
            e.Property(x => x.Plan).HasMaxLength(20).HasDefaultValue("monthly");
            e.Property(x => x.IncludedBrokerSlots).HasDefaultValue(5);
            e.Property(x => x.ExtraBrokerSlots).HasDefaultValue(0);
            e.Property(x => x.PixReferenceCode).HasMaxLength(32);
            e.Ignore(x => x.MaxBrokerSlots);
        });

        modelBuilder.Entity<TenantMembership>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.TenantId }).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.Memberships).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Tenant).WithMany(t => t.Memberships).HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<Property>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Status });
            e.HasIndex(x => new { x.City, x.Neighborhood, x.Status });
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.Property(x => x.AreaSqm).HasPrecision(10, 2);
            e.HasOne(x => x.Tenant).WithMany(t => t.Properties).HasForeignKey(x => x.TenantId);
            e.HasOne(x => x.ResponsibleBroker).WithMany(u => u.ResponsibleProperties).HasForeignKey(x => x.ResponsibleBrokerId);
        });

        modelBuilder.Entity<PropertyMedia>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.MediaType).HasDefaultValue(Domain.Enums.PropertyMediaType.Photo);
            e.HasOne(x => x.Property).WithMany(p => p.Media).HasForeignKey(x => x.PropertyId);
        });

        modelBuilder.Entity<TenantSettings>(e =>
        {
            e.HasKey(x => x.TenantId);
            e.HasOne(x => x.Tenant).WithOne(t => t.Settings).HasForeignKey<TenantSettings>(x => x.TenantId);
        });

        modelBuilder.Entity<BrokerSettings>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.TenantId }).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.BrokerSettings).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<CalendarBlock>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.BrokerId, x.StartAt, x.EndAt });
            e.HasOne(x => x.Broker).WithMany(u => u.CalendarBlocks).HasForeignKey(x => x.BrokerId);
        });

        modelBuilder.Entity<Visit>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ConfirmationCode).IsUnique();
            e.HasIndex(x => new { x.BrokerId, x.StartAt, x.EndAt });
            e.HasOne(x => x.Property).WithMany(p => p.Visits).HasForeignKey(x => x.PropertyId);
            e.HasOne(x => x.Tenant).WithMany(t => t.Visits).HasForeignKey(x => x.TenantId);
            e.HasOne(x => x.Broker).WithMany(u => u.Visits).HasForeignKey(x => x.BrokerId);
        });

        modelBuilder.Entity<WhatsAppOutboundLog>(e =>
        {
            e.HasKey(x => x.Id);
        });
    }
}
