using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Themes;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Themes;

public class ThemeResolver(AppDbContext db, IOptions<ThemesOptions> options) : IThemeResolver
{
    private readonly ThemesOptions _options = options.Value;

    public async Task<ThemeLocation> ResolveAsync(string themeKey, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var officialRoot = Path.GetFullPath(_options.RootPath);
        if (OfficialThemeCatalog.IsOfficial(themeKey))
        {
            var key = themeKey.Trim().ToLowerInvariant();
            return new ThemeLocation(key, Path.Combine(officialRoot, key), true);
        }

        if (OfficialThemeCatalog.TryParseCustomKey(themeKey, out var submissionId))
        {
            var submission = await db.CustomThemeSubmissions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);

            if (submission is not null
                && submission.TenantId == tenantId
                && submission.Status == CustomThemeStatus.Approved)
            {
                var customRoot = Path.GetFullPath(
                    string.IsNullOrWhiteSpace(_options.CustomRootPath)
                        ? Path.Combine(officialRoot, "..", "custom")
                        : _options.CustomRootPath);
                var live = Path.Combine(customRoot, tenantId.ToString("N"), submission.Version.ToString());
                if (Directory.Exists(live))
                    return new ThemeLocation($"custom/{tenantId:N}/{submission.Version}", live, false);
            }
        }

        return new ThemeLocation("moderno", Path.Combine(officialRoot, "moderno"), true);
    }
}
