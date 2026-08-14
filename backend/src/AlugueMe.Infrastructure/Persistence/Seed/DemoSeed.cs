using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Persistence.Seed;

public class DemoSeed(AppDbContext db, IOptions<SeedOptions> seedOptions, ILogger<DemoSeed> logger)
{
    private readonly SeedOptions _options = seedOptions.Value;

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureSaasAdminAsync(cancellationToken);

        var tenants = new[]
        {
            ("horizon", "Horizon Imóveis", TenantType.Agency, "moderno"),
            ("vista-urbana", "Vista Urbana", TenantType.Agency, "urbano"),
            ("casa-tradicao", "Casa & Tradição", TenantType.Agency, "classico"),
            ("atlas", "Atlas Residencial", TenantType.Independent, "minimal"),
            ("porto-lar", "Porto & Lar", TenantType.Agency, "porto")
        };

        foreach (var (slug, name, type, theme) in tenants)
            await EnsureTenantAsync(slug, name, type, theme, cancellationToken);

        await EnsureSuspendedTenantAsync(cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Demo seed completed");
    }

    private async Task EnsureSaasAdminAsync(CancellationToken cancellationToken)
    {
        var configuredAdmin = await db.Users.FirstOrDefaultAsync(
            u => u.Email == _options.SaasAdminEmail,
            cancellationToken);
        if (configuredAdmin is not null)
        {
            if (!configuredAdmin.IsSaasAdmin)
                throw new InvalidOperationException(
                    $"O e-mail administrativo configurado '{_options.SaasAdminEmail}' já pertence a um usuário não administrativo.");

            if (_options.ResetPasswords)
                configuredAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(_options.SaasAdminPassword);

            return;
        }

        // Reconciliamos a identidade configurada sem recriar usuário ou senha.
        var currentAdmin = await db.Users.FirstOrDefaultAsync(
            u => u.IsSaasAdmin,
            cancellationToken);
        if (currentAdmin is not null)
        {
            currentAdmin.Email = _options.SaasAdminEmail;
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = _options.SaasAdminEmail,
            Name = "SaaS Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(_options.SaasAdminPassword),
            IsSaasAdmin = true
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureTenantAsync(string slug, string name, TenantType type, string themeKey, CancellationToken cancellationToken)
    {
        var tenant = await db.Tenants.Include(t => t.Settings).FirstOrDefaultAsync(t => t.Slug == slug, cancellationToken);
        if (tenant is null)
        {
            tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Slug = slug,
                Name = name,
                Type = type,
                Status = TenantStatus.Active,
                ThemeKey = themeKey,
                Plan = "monthly",
                IncludedBrokerSlots = type == TenantType.Independent ? 1 : 5,
                ExtraBrokerSlots = 0
            };
            db.Tenants.Add(tenant);
            db.TenantSettings.Add(new TenantSettings
            {
                TenantId = tenant.Id,
                BufferMinutes = slug == "horizon" ? 60 : 60,
                VisitDurationMinutes = 60,
                WhatsAppNotifyEnabled = false
            });
        }
        else
        {
            tenant.Plan = string.IsNullOrWhiteSpace(tenant.Plan) ? "monthly" : tenant.Plan;
            tenant.IncludedBrokerSlots = type == TenantType.Independent ? 1 : Math.Max(tenant.IncludedBrokerSlots, 5);
            if (type == TenantType.Independent)
                tenant.ExtraBrokerSlots = 0;
        }

        Guid responsibleBrokerId;
        if (type == TenantType.Independent)
        {
            var indie = await EnsureUserAsync($"admin@{slug}.local", "Admin", MembershipRole.IndependentBroker, tenant, cancellationToken);
            responsibleBrokerId = indie.Id;
        }
        else
        {
            await EnsureUserAsync($"admin@{slug}.local", "Admin", MembershipRole.AgencyAdmin, tenant, cancellationToken);
            var broker1 = await EnsureUserAsync($"corretor1@{slug}.local", "Corretor 1", MembershipRole.Broker, tenant, cancellationToken);
            await EnsureUserAsync($"corretor2@{slug}.local", "Corretor 2", MembershipRole.Broker, tenant, cancellationToken);
            responsibleBrokerId = broker1.Id;

            if (slug == "horizon")
            {
                await EnsureBrokerSettingsAsync(broker1.Id, tenant.Id, 90, cancellationToken);
            }
        }

        // Memberships precisam estar persistidos antes de consultar no EnsureProperties
        await db.SaveChangesAsync(cancellationToken);
        await EnsurePropertiesAsync(tenant, responsibleBrokerId, cancellationToken);
    }

    private async Task EnsureSuspendedTenantAsync(CancellationToken cancellationToken)
    {
        if (await db.Tenants.AnyAsync(t => t.Slug == "suspenso-demo", cancellationToken))
            return;

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Slug = "suspenso-demo",
            Name = "Demo Suspensa",
            Type = TenantType.Agency,
            Status = TenantStatus.Suspended,
            ThemeKey = "moderno",
            Plan = "monthly",
            IncludedBrokerSlots = 5,
            ExtraBrokerSlots = 0
        };
        db.Tenants.Add(tenant);
        db.TenantSettings.Add(new TenantSettings { TenantId = tenant.Id });
    }

    private async Task<User> EnsureUserAsync(string email, string name, MembershipRole role, Tenant tenant, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                Name = name,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(_options.DemoPassword)
            };
            db.Users.Add(user);
        }
        else if (_options.ResetPasswords)
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(_options.DemoPassword);
        }

        if (!await db.TenantMemberships.AnyAsync(m => m.UserId == user.Id && m.TenantId == tenant.Id, cancellationToken))
        {
            db.TenantMemberships.Add(new TenantMembership
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TenantId = tenant.Id,
                Role = role
            });
        }

        return user;
    }

    private async Task EnsureBrokerSettingsAsync(Guid userId, Guid tenantId, int bufferMinutes, CancellationToken cancellationToken)
    {
        if (await db.BrokerSettings.AnyAsync(b => b.UserId == userId && b.TenantId == tenantId, cancellationToken))
            return;

        db.BrokerSettings.Add(new BrokerSettings
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = tenantId,
            BufferMinutes = bufferMinutes
        });
    }

    private async Task EnsurePropertiesAsync(Tenant tenant, Guid responsibleBrokerId, CancellationToken cancellationToken)
    {
        var count = await db.Properties.CountAsync(p => p.TenantId == tenant.Id, cancellationToken);
        if (count >= 3)
            return;

        var templates = new[]
        {
            ("Studio conectado no coração de SP", PropertyOperation.Rent, 3200m, 1, 45m, PropertyType.Studio),
            ("Apartamento amplo com vista", PropertyOperation.Sale, 850000m, 3, 95m, PropertyType.Apartment),
            ("Casa familiar em bairro tranquilo", PropertyOperation.Rent, 4500m, 3, 120m, PropertyType.House)
        };

        for (var i = count; i < templates.Length; i++)
        {
            var (title, op, price, beds, area, ptype) = templates[i];
            db.Properties.Add(new Property
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                ResponsibleBrokerId = responsibleBrokerId,
                Operation = op,
                Status = PropertyStatus.Published,
                PropertyType = ptype,
                Title = $"{title} — {tenant.Name}",
                Description = $"Imóvel demo para vitrine {tenant.ThemeKey}.",
                City = "São Paulo",
                Neighborhood = i switch { 0 => "Pinheiros", 1 => "Moema", _ => "Vila Mariana" },
                Price = price,
                Bedrooms = beds,
                AreaSqm = area,
                PublishedAt = DateTime.UtcNow
            });
        }
    }
}
