namespace AlugueMe.Application.Dtos.Tenants;

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    string Type,
    string Status,
    string ThemeKey,
    DateTime CreatedAt);

public record CreateTenantRequest(
    string Name,
    string Slug,
    string Type,
    string ThemeKey,
    string AdminEmail,
    string AdminPassword,
    string AdminName);

public record PatchTenantStatusRequest(string Status);

public record ThemeResponse(string ThemeKey);

public record UpdateThemeRequest(string ThemeKey);
