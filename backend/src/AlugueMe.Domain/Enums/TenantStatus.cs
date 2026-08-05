namespace AlugueMe.Domain.Enums;

public enum TenantStatus
{
    Active = 0,
    Suspended = 1,
    /// <summary>Aguardando confirmação de Pix pelo admin SaaS.</summary>
    PendingPayment = 2,
    /// <summary>Período de degustação gratuita (7 dias) — conta com acesso completo aguardando pagamento.</summary>
    Trial = 3
}
