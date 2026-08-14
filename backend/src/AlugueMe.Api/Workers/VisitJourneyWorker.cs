using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Email;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Workers;

public sealed class VisitJourneyWorker(IServiceScopeFactory scopeFactory, ILogger<VisitJourneyWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        do
        {
            try { await ProcessAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex) { logger.LogError(ex, "Falha no processamento da jornada de visitas."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emails = scope.ServiceProvider.GetRequiredService<TransactionalEmailService>();
        var now = DateTime.UtcNow;
        var visits = await db.Visits
            .Include(v => v.Property).Include(v => v.Tenant)
            .Where(v => v.Status == VisitStatus.Confirmed && v.StartAt > now && v.StartAt <= now.AddHours(25)
                && (v.Reminder24hSentAt == null || (v.StartAt <= now.AddHours(3) && v.Reminder2hSentAt == null)))
            .ToListAsync(ct);

        foreach (var visit in visits)
        {
            if (visit.StartAt <= now.AddHours(3) && visit.Reminder2hSentAt is null)
            {
                await emails.SendVisitReminderAsync(visit, visit.Tenant, "em cerca de 2 horas", ct);
                visit.Reminder2hSentAt = now;
            }
            else if (visit.Reminder24hSentAt is null)
            {
                await emails.SendVisitReminderAsync(visit, visit.Tenant, "amanhã", ct);
                visit.Reminder24hSentAt = now;
            }
        }
        await db.SaveChangesAsync(ct);
    }
}
