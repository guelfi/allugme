namespace AlugueMe.Application.Dtos.Tenants;

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    string Type,
    string Status,
    string ThemeKey,
    string Plan,
    int IncludedBrokerSlots,
    int ExtraBrokerSlots,
    int MaxBrokerSlots,
    DateTime CreatedAt,
    string? PixReferenceCode);

public record CreateTenantRequest(
    string Name,
    string Slug,
    string Type,
    string ThemeKey,
    string AdminEmail,
    string AdminPassword,
    string AdminName,
    string? Plan = null,
    int? ExtraBrokerSlots = null);

public record PatchTenantStatusRequest(string Status);

public record PatchTenantPlanRequest(
    string? Plan,
    int? ExtraBrokerSlots,
    string? Status);

public record ThemeResponse(string ThemeKey);

public record UpdateThemeRequest(string ThemeKey);
