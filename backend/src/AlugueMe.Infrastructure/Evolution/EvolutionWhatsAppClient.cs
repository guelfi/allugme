using System.Net.Http.Json;
using System.Text.Json.Serialization;
using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Evolution;

public class EvolutionWhatsAppClient(
    HttpClient httpClient,
    IOptions<EvolutionOptions> options,
    ILogger<EvolutionWhatsAppClient> logger) : IEvolutionWhatsAppClient
{
    private readonly EvolutionOptions _options = options.Value;

    public async Task<bool> SendTextAsync(string instanceName, string toE164, string text, CancellationToken cancellationToken = default)
    {
        var url = $"{_options.BaseUrl.TrimEnd('/')}/message/sendText/{instanceName}";
        var payload = new { number = toE164, text };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("apikey", _options.ApiKey);
        request.Content = JsonContent.Create(payload);

        try
        {
            var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning("Evolution send failed {Status}: {Body}", response.StatusCode, body);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Evolution send error");
            return false;
        }
    }
}

public class FakeEvolutionWhatsAppClient(ILogger<FakeEvolutionWhatsAppClient> logger) : IEvolutionWhatsAppClient
{
    public Task<bool> SendTextAsync(string instanceName, string toE164, string text, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("[FakeEvolution] instance={Instance} to={To} text={Text}", instanceName, toE164, text);
        return Task.FromResult(true);
    }
}

public class EvolutionWebhookPayload
{
    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("data")]
    public EvolutionWebhookData? Data { get; set; }
}

public class EvolutionWebhookData
{
    [JsonPropertyName("key")]
    public EvolutionMessageKey? Key { get; set; }

    [JsonPropertyName("message")]
    public EvolutionMessage? Message { get; set; }
}

public class EvolutionMessageKey
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("remoteJid")]
    public string? RemoteJid { get; set; }
}

public class EvolutionMessage
{
    [JsonPropertyName("conversation")]
    public string? Conversation { get; set; }

    [JsonPropertyName("extendedTextMessage")]
    public EvolutionExtendedText? ExtendedTextMessage { get; set; }
}

public class EvolutionExtendedText
{
    [JsonPropertyName("text")]
    public string? Text { get; set; }
}

public static class EvolutionPhoneHelper
{
    public static string? ExtractE164(string? remoteJid)
    {
        if (string.IsNullOrWhiteSpace(remoteJid))
            return null;

        var number = remoteJid.Split('@')[0];
        return number.StartsWith('+') ? number : $"+{number}";
    }

    public static string ExtractText(EvolutionWebhookPayload payload)
    {
        var msg = payload.Data?.Message;
        if (msg?.Conversation is { Length: > 0 } c)
            return c;
        if (msg?.ExtendedTextMessage?.Text is { Length: > 0 } t)
            return t;
        return string.Empty;
    }
}
