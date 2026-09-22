using AlugueMe.Application.Themes;

namespace AlugueMe.Application.Interfaces;

public sealed record VitrineComposeRequest(
    string Slug,
    string Page,
    Guid? PropertyId,
    ThemeSearchQuery Search);

public sealed record VitrineHtml(string Html, int StatusCode);

public interface IVitrineComposer
{
    Task<VitrineHtml> ComposeAsync(VitrineComposeRequest request, CancellationToken cancellationToken = default);
}
