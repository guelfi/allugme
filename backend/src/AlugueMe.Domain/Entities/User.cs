namespace AlugueMe.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    /// <summary>Caminho da foto de rosto (armazenada via IFileStorage), exibida ao visitante no agendamento de visita.</summary>
    public string? AvatarPath { get; set; }
    /// <summary>Quantidade de logins bem-sucedidos como corretor realizados sem foto de perfil.</summary>
    public int MissingAvatarLoginCount { get; set; }
    public bool IsSaasAdmin { get; set; }
    /// <summary>Conta do portal do cliente (visitante / interessado).</summary>
    public bool IsClient { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TenantMembership> Memberships { get; set; } = [];
    public ICollection<BrokerSettings> BrokerSettings { get; set; } = [];
    public ICollection<Property> ResponsibleProperties { get; set; } = [];
    public ICollection<CalendarBlock> CalendarBlocks { get; set; } = [];
    public ICollection<Visit> Visits { get; set; } = [];
    public ICollection<FavoriteProperty> Favorites { get; set; } = [];
}
