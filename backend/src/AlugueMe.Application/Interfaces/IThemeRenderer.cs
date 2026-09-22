namespace AlugueMe.Application.Interfaces;

public interface IThemeRenderer
{
    Task<string> RenderPageAsync(string themeKey, string pageName, Dictionary<string, string> placeholders, CancellationToken cancellationToken = default);

    Task<string> RenderPageAsync(
        ThemeLocation location,
        string pageName,
        Dictionary<string, string> placeholders,
        IReadOnlySet<string>? rawKeys,
        CancellationToken cancellationToken = default);

    Task<string> RenderPropertyCardAsync(
        ThemeLocation location,
        Dictionary<string, string> placeholders,
        CancellationToken cancellationToken = default);
}
