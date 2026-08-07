namespace AlugueMe.Application.Dtos.Brokers;

public record BrokerSeatDto(
    Guid UserId,
    string Name,
    string Email,
    string? Phone,
    string Role,
    string Status,
    DateTime CreatedAt,
    bool IsCurrentUser,
    string? AvatarUrl);

public record BrokerQuotaDto(
    string TenantType,
    string Plan,
    int IncludedBrokerSlots,
    int ExtraBrokerSlots,
    int UsedBrokerSlots,
    int MaxBrokerSlots,
    int RemainingBrokerSlots,
    bool CanManageBrokers);

public record CreateBrokerRequest(
    string Name,
    string Email,
    string Password,
    string? Phone);

public record InviteBrokerRequest(
    string Name,
    string Email,
    string? Phone);

public record TeamResponse(
    BrokerQuotaDto Quota,
    IReadOnlyList<BrokerSeatDto> Members);
