namespace AlugueMe.Application.Interfaces;

public interface IWebhookIdempotencyStore
{
    Task<bool> TryMarkProcessedAsync(string messageId, TimeSpan ttl, CancellationToken cancellationToken = default);
}
