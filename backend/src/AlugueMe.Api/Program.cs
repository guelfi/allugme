using AlugueMe.Api.Health;
using AlugueMe.Infrastructure;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using AlugueMe.Infrastructure.Persistence.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

var publicBasePath = builder.Configuration["PublicBasePath"];
if (!string.IsNullOrWhiteSpace(publicBasePath))
    builder.Configuration["Storage:PublicBaseUrl"] = $"{publicBasePath.TrimEnd('/')}/media";

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddEndpointsApiExplorer();
var homeUrl = string.IsNullOrWhiteSpace(publicBasePath)
    ? "/"
    : $"{publicBasePath.TrimEnd('/')}/";

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Allugme API",
        Version = "v1",
        Description =
            $"API do SaaS Allugme — Swagger exposto durante o desenvolvimento.\n\n" +
            $"[← Voltar ao Allugme]({homeUrl})"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer. Ex.: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://192.168.15.119",
                "http://129.153.86.168")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddHealthChecks()
    .AddCheck<PostgresHealthCheck>("postgres")
    .AddCheck<RedisHealthCheck>("redis");

var app = builder.Build();

// Nginx remove o prefixo /allugme antes do proxy — não usar UsePathBase.
app.UseSwagger(c =>
{
    c.RouteTemplate = "swagger/{documentName}/swagger.json";
});
app.UseSwaggerUI(c =>
{
    // Endpoint público via nginx: /allugme/swagger/v1/swagger.json
    var swaggerJson = string.IsNullOrWhiteSpace(publicBasePath)
        ? "/swagger/v1/swagger.json"
        : $"{publicBasePath.TrimEnd('/')}/swagger/v1/swagger.json";
    c.SwaggerEndpoint(swaggerJson, "Allugme API v1");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "Allugme API";
    c.HeadContent = $$"""
        <style>
          .allugme-home-link {
            position: fixed;
            top: 10px;
            right: 14px;
            z-index: 10001;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #0f766e;
            color: #fff !important;
            text-decoration: none !important;
            font: 600 0.9rem/1 system-ui, -apple-system, sans-serif;
            padding: 0.55rem 0.95rem;
            border-radius: 8px;
            box-shadow: 0 4px 14px rgba(15, 40, 36, 0.28);
          }
          .allugme-home-link:hover { background: #0d655e; }
          .swagger-ui .topbar .download-url-wrapper { margin-right: 9.5rem; }
          @media (max-width: 768px) {
            .allugme-home-link {
              top: auto;
              bottom: 14px;
              right: 14px;
              left: 14px;
              justify-content: center;
            }
            .swagger-ui .topbar .download-url-wrapper { margin-right: 0; }
          }
        </style>
        <script>
          document.addEventListener('DOMContentLoaded', function () {
            var a = document.createElement('a');
            a.className = 'allugme-home-link';
            a.href = {{System.Text.Json.JsonSerializer.Serialize(homeUrl)}};
            a.textContent = '← Voltar ao Allugme';
            a.setAttribute('aria-label', 'Voltar ao domínio Allugme');
            document.body.appendChild(a);
          });
        </script>
        """;
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

var storagePath = builder.Configuration.GetSection(StorageOptions.SectionName).Get<StorageOptions>()?.MediaPath ?? "storage/media";
Directory.CreateDirectory(Path.GetFullPath(storagePath));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(Path.GetFullPath(storagePath)),
    RequestPath = "/media"
});

// Assets dos temas oficiais (CSS/JS/img da vitrine)
var themesRoot = builder.Configuration.GetSection(ThemesOptions.SectionName).Get<ThemesOptions>()?.RootPath
    ?? "themes/official";
themesRoot = Path.GetFullPath(themesRoot);
if (Directory.Exists(themesRoot))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(themesRoot),
        RequestPath = "/themes"
    });
}

app.MapControllers();
app.MapHealthChecks("/health");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var seedEnabled = builder.Configuration.GetValue<bool>("Seed:Enabled");
    if (seedEnabled)
    {
        var seeder = scope.ServiceProvider.GetRequiredService<DemoSeed>();
        await seeder.SeedAsync();
    }
}

app.Run();

public partial class Program;
