using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Visits;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AlugueMe.Infrastructure.Email;

/// <summary>Envio fail-soft de e-mails de visita e convite.</summary>
public class TransactionalEmailService(
    IEmailSender emailSender,
    IEmailTemplateRenderer templates,
    IOptions<AppPublicOptions> appOptions,
    ILogger<TransactionalEmailService> logger)
{
    public async Task SendBrokerInviteAsync(
        User invitee,
        Tenant tenant,
        string rawToken,
        CancellationToken ct)
    {
        var baseUrl = appOptions.Value.DashboardBaseUrl.TrimEnd('/');
        var acceptUrl = $"{baseUrl}/accept-invite?token={Uri.EscapeDataString(rawToken)}";
        try
        {
            var html = await templates.RenderAsync(
                EmailTemplateKeys.BrokerInvite,
                tenant.ThemeKey,
                tenant.Id,
                new Dictionary<string, string>
                {
                    ["user_name"] = invitee.Name,
                    ["user_email"] = invitee.Email,
                    ["brand_name"] = tenant.Name,
                    ["accept_url"] = acceptUrl,
                    ["expires_days"] = "7"
                },
                ct);
            await emailSender.SendAsync(
                invitee.Email,
                $"{tenant.Name} — Convite para a equipe",
                html,
                ct: ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao enviar convite de corretor para {Email}.", invitee.Email);
        }
    }

    public async Task SendVisitCreatedToBrokerAsync(
        Visit visit,
        Property property,
        User broker,
        Tenant tenant,
        bool emailEnabled,
        CancellationToken ct)
    {
        if (!emailEnabled || string.IsNullOrWhiteSpace(broker.Email))
            return;

        var sp = VisitSlotCalculator.ToSaoPaulo(visit.StartAt);
        try
        {
            var html = await templates.RenderAsync(
                EmailTemplateKeys.VisitCreatedBroker,
                tenant.ThemeKey,
                tenant.Id,
                new Dictionary<string, string>
                {
                    ["user_name"] = broker.Name,
                    ["brand_name"] = tenant.Name,
                    ["property_title"] = property.Title,
                    ["visitor_name"] = visit.VisitorName,
                    ["visitor_phone"] = visit.VisitorPhone,
                    ["visitor_email"] = visit.VisitorEmail ?? "—",
                    ["visit_when"] = sp.ToString("dd/MM/yyyy HH:mm"),
                    ["confirmation_code"] = visit.ConfirmationCode,
                    ["panel_url"] = $"{appOptions.Value.DashboardBaseUrl.TrimEnd('/')}/visits"
                },
                ct);
            await emailSender.SendAsync(
                broker.Email,
                $"{tenant.Name} — Nova visita solicitada",
                html,
                ct: ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao e-mailar corretor sobre visita {VisitId}.", visit.Id);
        }
    }

    public async Task SendVisitStatusToVisitorAsync(
        Visit visit,
        Property property,
        Tenant tenant,
        bool emailEnabled,
        CancellationToken ct)
    {
        if (!emailEnabled || string.IsNullOrWhiteSpace(visit.VisitorEmail))
            return;
        if (visit.Status is not (VisitStatus.Confirmed or VisitStatus.Rejected or VisitStatus.Done))
            return;

        if (visit.Status == VisitStatus.Done)
        {
            await SendSimpleVisitorEmailAsync(visit, tenant, $"{tenant.Name} — Conte como foi sua visita",
                "Sua visita foi concluída", $"Avalie o imóvel e o atendimento no seu portal: {appOptions.Value.DashboardBaseUrl.TrimEnd('/')}/portal/visits", ct);
            return;
        }

        var key = visit.Status == VisitStatus.Confirmed
            ? EmailTemplateKeys.VisitConfirmedVisitor
            : EmailTemplateKeys.VisitRejectedVisitor;
        var subject = visit.Status == VisitStatus.Confirmed
            ? $"{tenant.Name} — Visita confirmada"
            : $"{tenant.Name} — Visita recusada";
        var portalUrl = $"{appOptions.Value.DashboardBaseUrl.TrimEnd('/')}/portal";
        var sp = VisitSlotCalculator.ToSaoPaulo(visit.StartAt);

        try
        {
            var html = await templates.RenderAsync(
                key,
                tenant.ThemeKey,
                tenant.Id,
                new Dictionary<string, string>
                {
                    ["user_name"] = visit.VisitorName,
                    ["brand_name"] = tenant.Name,
                    ["property_title"] = property.Title,
                    ["visit_when"] = sp.ToString("dd/MM/yyyy HH:mm"),
                    ["portal_url"] = portalUrl,
                    ["status_label"] = visit.Status == VisitStatus.Confirmed ? "confirmada" : "recusada"
                },
                ct);
            await emailSender.SendAsync(visit.VisitorEmail, subject, html, ct: ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao e-mailar visitante sobre visita {VisitId}.", visit.Id);
        }
    }

    public Task SendVisitReceivedToVisitorAsync(Visit visit, Tenant tenant, bool enabled, CancellationToken ct) =>
        !enabled ? Task.CompletedTask : SendSimpleVisitorEmailAsync(visit, tenant,
            $"{tenant.Name} — Solicitação de visita recebida", "Recebemos sua solicitação",
            "O corretor irá analisar o horário e você receberá uma confirmação.", ct);

    public Task SendVisitReminderAsync(Visit visit, Tenant tenant, string whenLabel, CancellationToken ct) =>
        SendSimpleVisitorEmailAsync(visit, tenant, $"{tenant.Name} — Lembrete de visita",
            $"Sua visita é {whenLabel}", $"Imóvel: {visit.Property.Title}. Consulte os detalhes em {appOptions.Value.DashboardBaseUrl.TrimEnd('/')}/portal/visits", ct);

    private async Task SendSimpleVisitorEmailAsync(Visit visit, Tenant tenant, string subject, string heading, string body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(visit.VisitorEmail)) return;
        try
        {
            var html = $"<div style=\"font-family:Arial;max-width:520px;margin:auto\"><h2 style=\"color:#0f766e\">{System.Net.WebUtility.HtmlEncode(heading)}</h2><p>Olá, {System.Net.WebUtility.HtmlEncode(visit.VisitorName)}.</p><p>{System.Net.WebUtility.HtmlEncode(body)}</p><p>{System.Net.WebUtility.HtmlEncode(tenant.Name)} · Allugme</p></div>";
            await emailSender.SendAsync(visit.VisitorEmail, subject, html, ct: ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao enviar e-mail da jornada da visita {VisitId}.", visit.Id);
        }
    }
}
