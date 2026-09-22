using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Urls;
using Microsoft.Extensions.Options;

namespace AlugueMe.Api.Urls;

public sealed class DashboardBaseUrlService(
    IOptions<AppPublicOptions> options,
    IHostEnvironment environment,
    IHttpContextAccessor httpContextAccessor,
    IConfiguration configuration) : IDashboardBaseUrl
{
    public string GetBaseUrl()
    {
        var request = httpContextAccessor.HttpContext?.Request;
        var scheme = request is null
            ? null
            : request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? request.Scheme;
        var host = request?.Host.Value;
        return DashboardUrl.Resolve(
            options.Value.DashboardBaseUrl,
            environment.IsDevelopment(),
            scheme,
            host,
            configuration["PublicBasePath"]);
    }
}
