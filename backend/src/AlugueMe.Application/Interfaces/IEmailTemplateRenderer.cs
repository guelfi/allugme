namespace AlugueMe.Application.Interfaces;

/// <summary>
/// Chaves estáveis de templates transacionais.
/// Arquivos: themes/.../emails/{key}.html ou storage/email-templates/{tenantId}/{key}.html
/// </summary>
public static class EmailTemplateKeys
{
    public const string PasswordReset = "password-reset";
    public const string BrokerInvite = "broker-invite";
    public const string VisitCreatedBroker = "visit-created-broker";
    public const string VisitConfirmedVisitor = "visit-confirmed-visitor";
    public const string VisitRejectedVisitor = "visit-rejected-visitor";
}

/// <summary>
/// Renderiza HTML de e-mail com resolução:
/// 1) override do tenant (storage/email-templates/{tenantId}/{key}.html) — identidade custom;
/// 2) template do tema oficial (themes/{themeKey}/emails/{key}.html) — alinhado ao layout da vitrine;
/// 3) fallback da plataforma (themes/_platform/emails/{key}.html).
/// </summary>
public interface IEmailTemplateRenderer
{
    Task<string> RenderAsync(
        string templateKey,
        string? themeKey,
        Guid? tenantId,
        IReadOnlyDictionary<string, string> placeholders,
        CancellationToken cancellationToken = default);
}
