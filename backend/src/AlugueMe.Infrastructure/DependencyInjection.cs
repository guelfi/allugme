using System.Text;
using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Visits;
using AlugueMe.Infrastructure.Background;
using AlugueMe.Infrastructure.Email;
using AlugueMe.Infrastructure.Evolution;
using AlugueMe.Infrastructure.Identity;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Payments;
using AlugueMe.Infrastructure.Persistence;
using AlugueMe.Infrastructure.Redis;
using AlugueMe.Infrastructure.Storage;
using AlugueMe.Infrastructure.Themes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

namespace AlugueMe.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<EvolutionOptions>(configuration.GetSection(EvolutionOptions.SectionName));
        services.Configure<SeedOptions>(configuration.GetSection(SeedOptions.SectionName));
        services.Configure<ThemesOptions>(configuration.GetSection(ThemesOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));
        services.Configure<PixOptions>(configuration.GetSection(PixOptions.SectionName));
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("ConnectionStrings:PostgreSQL is required");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        var redisConnection = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("ConnectionStrings:Redis is required");
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnection));

        services.AddScoped<IRedisLockService, RedisLockService>();
        services.AddSingleton<IWhatsAppQueue, WhatsAppQueue>();
        services.AddSingleton<IWebhookIdempotencyStore, WebhookIdempotencyStore>();

        var evolutionEnabled = configuration.GetValue<bool>("Evolution:Enabled");
        if (evolutionEnabled)
        {
            services.AddHttpClient<IEvolutionWhatsAppClient, EvolutionWhatsAppClient>();
        }
        else
        {
            services.AddSingleton<IEvolutionWhatsAppClient, FakeEvolutionWhatsAppClient>();
        }

        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddSingleton<IThemeRenderer, ThemeRenderer>();
        services.AddSingleton<IQrCodeGenerator, QrCodeImageGenerator>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<VisitSlotCalculator>();
        services.AddScoped<Persistence.Seed.DemoSeed>();
        services.AddHostedService<WhatsAppOutboundWorker>();

        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration is required");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                    NameClaimType = "sub",
                    RoleClaimType = "role"
                };
            });

        services.AddAuthorization();

        return services;
    }
}
