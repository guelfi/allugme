using System.Net;
using System.Net.Mail;
using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Email;

/// <summary>
/// Envio de e-mail via SMTP simples (System.Net.Mail). Se não houver Host configurado, apenas
/// registra um aviso — o fluxo de negócio (ex.: cadastro) nunca deve falhar por causa do e-mail.
/// </summary>
public class SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        IReadOnlyList<EmailAttachment>? inlineAttachments = null,
        CancellationToken ct = default)
    {
        var config = options.Value;
        if (string.IsNullOrWhiteSpace(config.Host))
        {
            logger.LogWarning("Smtp:Host não configurado — e-mail para {To} com assunto \"{Subject}\" não foi enviado.", to, subject);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(config.FromAddress, config.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            if (inlineAttachments is not null)
            {
                foreach (var attachment in inlineAttachments)
                {
                    var stream = new MemoryStream(attachment.Content);
                    var mailAttachment = new Attachment(stream, attachment.FileName, attachment.ContentType);
                    if (!string.IsNullOrWhiteSpace(attachment.ContentId))
                    {
                        mailAttachment.ContentId = attachment.ContentId;
                        mailAttachment.ContentDisposition!.Inline = true;
                    }
                    message.Attachments.Add(mailAttachment);
                }
            }

            using var client = new SmtpClient(config.Host, config.Port)
            {
                EnableSsl = config.UseSsl,
                Credentials = string.IsNullOrWhiteSpace(config.User)
                    ? null
                    : new NetworkCredential(config.User, config.Password)
            };
            await client.SendMailAsync(message, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao enviar e-mail para {To} com assunto \"{Subject}\".", to, subject);
        }
    }
}
