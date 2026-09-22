namespace AlugueMe.Application.Interfaces;

public sealed record CustomThemePackageResult(string StorageFolder, IReadOnlyList<string> Errors)
{
    public bool IsValid => Errors.Count == 0;
}

public interface ICustomThemePackage
{
    Task<CustomThemePackageResult> StorePendingAsync(
        Guid tenantId,
        Guid submissionId,
        int version,
        string originalFileName,
        Stream zipContent,
        CancellationToken cancellationToken = default);

    string GetPendingDirectory(string storageFolder);
    string GetApprovedDirectory(Guid tenantId, int version);
}
