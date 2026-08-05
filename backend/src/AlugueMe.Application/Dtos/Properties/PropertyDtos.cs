namespace AlugueMe.Application.Dtos.Properties;

public record PropertyDto(
    Guid Id,
    Guid TenantId,
    Guid ResponsibleBrokerId,
    string Operation,
    string Status,
    string PropertyType,
    string Title,
    string Description,
    string City,
    string Neighborhood,
    decimal Price,
    int Bedrooms,
    decimal AreaSqm,
    DateTime CreatedAt,
    DateTime? PublishedAt,
    IReadOnlyList<PropertyMediaDto> Media);

public record PropertyMediaDto(Guid Id, string Url, string MediaType, int SortOrder);

public record CreatePropertyRequest(
    string Operation,
    string PropertyType,
    string Title,
    string Description,
    string City,
    string Neighborhood,
    decimal Price,
    int Bedrooms,
    decimal AreaSqm,
    Guid? ResponsibleBrokerId);

public record UpdatePropertyRequest(
    string? Operation,
    string? PropertyType,
    string? Title,
    string? Description,
    string? City,
    string? Neighborhood,
    decimal? Price,
    int? Bedrooms,
    decimal? AreaSqm,
    Guid? ResponsibleBrokerId);

public record PublicPropertyDto(
    Guid Id,
    string Title,
    string Description,
    string City,
    string Neighborhood,
    decimal Price,
    int Bedrooms,
    decimal AreaSqm,
    string Operation,
    string PropertyType,
    string TenantName,
    string TenantSlug,
    IReadOnlyList<string> ImageUrls,
    string? VideoUrl,
    string BrokerName,
    string? BrokerAvatarUrl);

public record PublicPropertySearchResult(
    IReadOnlyList<PublicPropertyDto> Items,
    int Total);
