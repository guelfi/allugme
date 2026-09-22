namespace AlugueMe.Application.Interfaces;

public sealed record ThemeLocation(
    string PublicAssetKey,
    string RootDirectory,
    bool IsOfficial);

public interface IThemeResolver
{
    Task<ThemeLocation> ResolveAsync(string themeKey, Guid tenantId, CancellationToken cancellationToken = default);
}
