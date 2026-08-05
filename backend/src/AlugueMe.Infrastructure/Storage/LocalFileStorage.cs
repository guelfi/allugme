using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Storage;

public class LocalFileStorage(IOptions<StorageOptions> options) : IFileStorage
{
    private readonly StorageOptions _options = options.Value;

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(fileName);
        var storedName = $"{Guid.NewGuid():N}{ext}";
        var dir = Path.GetFullPath(_options.MediaPath);
        Directory.CreateDirectory(dir);
        var fullPath = Path.Combine(dir, storedName);

        await using var fs = File.Create(fullPath);
        await content.CopyToAsync(fs, cancellationToken);

        return storedName;
    }

    public string GetPublicUrl(string path) =>
        $"{_options.PublicBaseUrl.TrimEnd('/')}/{path.TrimStart('/')}";

    public Task DeleteAsync(string path, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(Path.GetFullPath(_options.MediaPath), path);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }
}
