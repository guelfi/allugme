using AlugueMe.Domain.Enums;

namespace AlugueMe.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public TenantType Type { get; set; }
    public TenantStatus Status { get; set; } = TenantStatus.Active;
    public string ThemeKey { get; set; } = "moderno";
    /// <summary>monthly | yearly</summary>
    public string Plan { get; set; } = "monthly";
    /// <summary>Assentos inclusos no plano (imobiliária: 5; independente: 1).</summary>
    public int IncludedBrokerSlots { get; set; } = 5;
    /// <summary>Assentos extras contratados além do incluso (só imobiliária).</summary>
    public int ExtraBrokerSlots { get; set; }
    /// <summary>Código curto exibido no Pix "copia e cola" do cadastro, usado pelo administrador para conciliar o pagamento com esta conta.</summary>
    public string? PixReferenceCode { get; set; }
    /// <summary>Data em que o período de degustação gratuita (7 dias) termina, se aplicável.</summary>
    public DateTime? TrialEndsAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int MaxBrokerSlots =>
        Type == TenantType.Independent
            ? 1
            : Math.Max(1, IncludedBrokerSlots) + Math.Max(0, ExtraBrokerSlots);

    public ICollection<TenantMembership> Memberships { get; set; } = [];
    public ICollection<Property> Properties { get; set; } = [];
    public TenantSettings? Settings { get; set; }
    public ICollection<Visit> Visits { get; set; } = [];
}
