namespace AlugueMe.Application.Interfaces;

public interface IRedisLockService
{
    Task<IAsyncDisposable?> AcquireLockAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default);
}
