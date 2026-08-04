namespace AlugueMe.Application.Interfaces;

public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken = default);
    string GetPublicUrl(string path);
}
