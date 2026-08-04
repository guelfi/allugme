namespace AlugueMe.Application.Interfaces;

public interface IThemeRenderer
{
    Task<string> RenderPageAsync(string themeKey, string pageName, Dictionary<string, string> placeholders, CancellationToken cancellationToken = default);
}
