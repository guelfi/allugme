namespace AlugueMe.Application.Interfaces;

public record WhatsAppQueueMessage(
    Guid? TenantId,
    Guid? VisitId,
    string InstanceName,
    string ToE164,
    string Text);

public interface IWhatsAppQueue
{
    Task EnqueueAsync(WhatsAppQueueMessage message, CancellationToken cancellationToken = default);
    Task<WhatsAppQueueMessage?> DequeueAsync(CancellationToken cancellationToken = default);
}
