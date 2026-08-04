using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace AlugueMe.Infrastructure.Redis;

public class RedisLockService(IConnectionMultiplexer redis, IOptions<RedisOptions> options) : IRedisLockService
{
    private readonly IDatabase _db = redis.GetDatabase();
    private readonly string _prefix = options.Value.KeyPrefix;

    public async Task<IAsyncDisposable?> AcquireLockAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        var lockKey = $"{_prefix}lock:{key}";
        var token = Guid.NewGuid().ToString("N");
        if (!await _db.StringSetAsync(lockKey, token, expiry, When.NotExists))
            return null;

        return new RedisLockRelease(_db, lockKey, token);
    }

    private sealed class RedisLockRelease(IDatabase db, string key, string token) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync()
        {
            var current = await db.StringGetAsync(key);
            if (current == token)
                await db.KeyDeleteAsync(key);
        }
    }
}

public class WhatsAppQueue(IConnectionMultiplexer redis, IOptions<RedisOptions> options) : IWhatsAppQueue
{
    private readonly IDatabase _db = redis.GetDatabase();
    private readonly string _queueKey = $"{options.Value.KeyPrefix}queue:whatsapp";

    public async Task EnqueueAsync(WhatsAppQueueMessage message, CancellationToken cancellationToken = default)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(message);
        await _db.ListLeftPushAsync(_queueKey, json);
    }

    public async Task<WhatsAppQueueMessage?> DequeueAsync(CancellationToken cancellationToken = default)
    {
        var value = await _db.ListRightPopAsync(_queueKey);
        if (value.IsNullOrEmpty)
            return null;

        return System.Text.Json.JsonSerializer.Deserialize<WhatsAppQueueMessage>(value.ToString());
    }
}

public class WebhookIdempotencyStore(IConnectionMultiplexer redis, IOptions<RedisOptions> options) : IWebhookIdempotencyStore
{
    private readonly IDatabase _db = redis.GetDatabase();
    private readonly string _prefix = options.Value.KeyPrefix;

    public async Task<bool> TryMarkProcessedAsync(string messageId, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var key = $"{_prefix}idem:evo:{messageId}";
        return await _db.StringSetAsync(key, "1", ttl, When.NotExists);
    }
}
