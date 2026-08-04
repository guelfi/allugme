namespace AlugueMe.Application.Interfaces;

public interface IEvolutionWhatsAppClient
{
    Task<bool> SendTextAsync(string instanceName, string toE164, string text, CancellationToken cancellationToken = default);
}
