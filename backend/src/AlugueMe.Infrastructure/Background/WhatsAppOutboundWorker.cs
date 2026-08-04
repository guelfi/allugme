using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Entities;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AlugueMe.Infrastructure.Background;

public class WhatsAppOutboundWorker(
    IServiceScopeFactory scopeFactory,
    IWhatsAppQueue queue,
    ILogger<WhatsAppOutboundWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var message = await queue.DequeueAsync(stoppingToken);
                if (message is null)
                {
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                    continue;
                }

                using var scope = scopeFactory.CreateScope();
                var client = scope.ServiceProvider.GetRequiredService<IEvolutionWhatsAppClient>();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var success = await client.SendTextAsync(message.InstanceName, message.ToE164, message.Text, stoppingToken);
                db.WhatsAppOutboundLogs.Add(new WhatsAppOutboundLog
                {
                    Id = Guid.NewGuid(),
                    TenantId = message.TenantId,
                    VisitId = message.VisitId,
                    ToE164 = message.ToE164,
                    Payload = message.Text,
                    Status = success ? "sent" : "failed",
                    Error = success ? null : "Evolution send failed"
                });

                if (success && message.VisitId.HasValue)
                {
                    var visit = await db.Visits.FindAsync([message.VisitId.Value], stoppingToken);
                    if (visit is not null)
                        visit.NotifiedAt = DateTime.UtcNow;
                }

                await db.SaveChangesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "WhatsApp worker error");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}
