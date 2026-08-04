using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;

namespace AlugueMe.Application.Common;

public static class EnumMapper
{
    public static string ToApi(MembershipRole role) => role switch
    {
        MembershipRole.AgencyAdmin => "agency_admin",
        MembershipRole.Broker => "broker",
        MembershipRole.IndependentBroker => "independent_broker",
        _ => role.ToString()
    };

    public static MembershipRole ParseMembershipRole(string value) => value.ToLowerInvariant() switch
    {
        "agency_admin" => MembershipRole.AgencyAdmin,
        "broker" => MembershipRole.Broker,
        "independent_broker" => MembershipRole.IndependentBroker,
        _ => Enum.Parse<MembershipRole>(value, true)
    };

    public static string ToApi(TenantType type) => type == TenantType.Agency ? "agency" : "independent";
    public static TenantType ParseTenantType(string value) =>
        value.Equals("independent", StringComparison.OrdinalIgnoreCase) ? TenantType.Independent : TenantType.Agency;

    public static string ToApi(TenantStatus status) =>
        status == TenantStatus.Active ? "active" : "suspended";

    public static TenantStatus ParseTenantStatus(string value) =>
        value.Equals("suspended", StringComparison.OrdinalIgnoreCase) ? TenantStatus.Suspended : TenantStatus.Active;

    public static string ToApi(PropertyOperation op) => op == PropertyOperation.Rent ? "rent" : "sale";
    public static PropertyOperation ParsePropertyOperation(string value) =>
        value.Equals("rent", StringComparison.OrdinalIgnoreCase) ? PropertyOperation.Rent : PropertyOperation.Sale;

    public static string ToApi(PropertyStatus status) => status switch
    {
        PropertyStatus.Published => "published",
        PropertyStatus.Unlisted => "unlisted",
        _ => "draft"
    };

    public static PropertyStatus ParsePropertyStatus(string value) => value.ToLowerInvariant() switch
    {
        "published" => PropertyStatus.Published,
        "unlisted" => PropertyStatus.Unlisted,
        _ => PropertyStatus.Draft
    };

    public static string ToApi(PropertyType type) => type.ToString().ToLowerInvariant();
    public static PropertyType ParsePropertyType(string value) =>
        Enum.TryParse<PropertyType>(value, true, out var t) ? t : PropertyType.Apartment;

    public static string ToApi(VisitStatus status) => status.ToString().ToLowerInvariant();
    public static VisitStatus ParseVisitStatus(string value) =>
        Enum.Parse<VisitStatus>(value, true);

    public static string? ToApi(ConfirmedVia? via) => via?.ToString().ToLowerInvariant();
}

public static class ConfirmationCodeGenerator
{
    private const string Chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string Generate(int length = 6)
    {
        var random = Random.Shared;
        return new string(Enumerable.Range(0, length).Select(_ => Chars[random.Next(Chars.Length)]).ToArray());
    }
}

public static class DtoMappers
{
    public static Dtos.Auth.MembershipDto ToDto(TenantMembership m) =>
        new(m.TenantId, m.Tenant.Name, m.Tenant.Slug, EnumMapper.ToApi(m.Role));

    public static Dtos.Tenants.TenantDto ToDto(Tenant t) =>
        new(t.Id, t.Name, t.Slug, EnumMapper.ToApi(t.Type), EnumMapper.ToApi(t.Status), t.ThemeKey, t.CreatedAt);

    public static Dtos.Properties.PropertyDto ToDto(Property p, Func<string, string> urlResolver) =>
        new(p.Id, p.TenantId, p.ResponsibleBrokerId, EnumMapper.ToApi(p.Operation), EnumMapper.ToApi(p.Status),
            EnumMapper.ToApi(p.PropertyType), p.Title, p.Description, p.City, p.Neighborhood, p.Price,
            p.Bedrooms, p.AreaSqm, p.CreatedAt, p.PublishedAt,
            p.Media.OrderBy(m => m.SortOrder).Select(m => new Dtos.Properties.PropertyMediaDto(m.Id, urlResolver(m.Path), m.SortOrder)).ToList());

    public static Dtos.Visits.VisitDto ToDto(Visit v) =>
        new(v.Id, v.PropertyId, v.Property.Title, v.TenantId, v.BrokerId, v.Broker.Name,
            v.VisitorName, v.VisitorPhone, v.VisitorEmail, v.StartAt, v.EndAt,
            v.BufferMinutesApplied, EnumMapper.ToApi(v.Status), v.ConfirmationCode,
            v.NotifiedAt, EnumMapper.ToApi(v.ConfirmedVia), v.CreatedAt);
}
