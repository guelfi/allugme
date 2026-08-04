namespace AlugueMe.Application.Dtos.Auth;

public record RegisterRequest(string Email, string Password, string Name, string? Phone);

public record LoginRequest(string Email, string Password, Guid? TenantId);

public record AuthResponse(string Token, UserDto User);

public record UserDto(
    Guid Id,
    string Email,
    string Name,
    string? Phone,
    bool IsSaasAdmin,
    IReadOnlyList<MembershipDto> Memberships);

public record MembershipDto(
    Guid TenantId,
    string TenantName,
    string TenantSlug,
    string Role);
