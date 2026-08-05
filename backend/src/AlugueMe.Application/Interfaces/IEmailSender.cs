namespace AlugueMe.Application.Interfaces;

public record EmailAttachment(string FileName, byte[] Content, string ContentType, string? ContentId = null);

public interface IEmailSender
{
    /// <summary>
    /// Envia um e-mail HTML. Implementações devem ser tolerantes a falhas de configuração/SMTP
    /// (registrar aviso e não lançar), já que o fluxo de negócio nunca deve falhar por causa do e-mail.
    /// </summary>
    Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        IReadOnlyList<EmailAttachment>? inlineAttachments = null,
        CancellationToken ct = default);
}
