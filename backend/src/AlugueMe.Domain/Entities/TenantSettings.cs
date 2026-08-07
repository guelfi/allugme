namespace AlugueMe.Domain.Entities;

public class TenantSettings
{
    public Guid TenantId { get; set; }
    public int BufferMinutes { get; set; } = 60;
    public int VisitDurationMinutes { get; set; } = 60;
    public string? WhatsAppE164 { get; set; }
    public string? EvolutionInstanceName { get; set; }
    public bool WhatsAppNotifyEnabled { get; set; }
    /// <summary>Enviar e-mails transacionais de visita (corretor / visitante).</summary>
    public bool EmailNotifyEnabled { get; set; } = true;

    public Tenant Tenant { get; set; } = null!;
}
