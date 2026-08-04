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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AlugueMe API", Version = "v1" });
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

if (!string.IsNullOrWhiteSpace(publicBasePath))
    app.UsePathBase(publicBasePath);

app.UseSwagger(c =>
{
    c.RouteTemplate = "swagger/{documentName}/swagger.json";
});
app.UseSwaggerUI(c =>
{
    var swaggerPath = string.IsNullOrWhiteSpace(publicBasePath)
        ? "/swagger/v1/swagger.json"
        : $"{publicBasePath.TrimEnd('/')}/swagger/v1/swagger.json";
    c.SwaggerEndpoint(swaggerPath, "AlugueMe API v1");
    c.RoutePrefix = "swagger";
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
