namespace AlugueMe.Application.Dtos.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string Name,
    string Phone,
    /// <summary>agency | independent</summary>
    string AccountType,
    string BusinessName,
    /// <summary>monthly | yearly</summary>
    string Plan,
    /// <summary>Código exibido no Pix "copia e cola" da tela de confirmação, para conciliação manual.</summary>
    string? PixReferenceCode = null);

public record LoginRequest(string Email, string Password, Guid? TenantId);

public record AuthResponse(string Token, UserDto User);

public record UserDto(
    Guid Id,
    string Email,
    string Name,
    string? Phone,
    bool IsSaasAdmin,
    string? AvatarUrl,
    IReadOnlyList<MembershipDto> Memberships);

public record MembershipDto(
    Guid TenantId,
    string TenantName,
    string TenantSlug,
    string Role,
    string TenantType,
    string Plan,
    int IncludedBrokerSlots,
    int ExtraBrokerSlots,
    int UsedBrokerSlots,
    int MaxBrokerSlots,
    bool CanManageBrokers);
