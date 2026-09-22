using AlugueMe.Domain.Enums;

namespace AlugueMe.Application.Themes;

public sealed record ThemeSearchQuery(
    string? City,
    string? Neighborhood,
    decimal? MaxPrice,
    int? Bedrooms,
    PropertyOperation? Operation)
{
    public static ThemeSearchQuery Empty { get; } = new(null, null, null, null, null);

    public static ThemeSearchQuery From(IEnumerable<KeyValuePair<string, string?>> values)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in values)
        {
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
                continue;
            map[key.Trim()] = value.Trim();
        }

        return new ThemeSearchQuery(
            First(map, "city", "cidade"),
            First(map, "neighborhood", "bairro"),
            ParseDecimal(First(map, "maxPrice", "price", "valor_max")),
            ParseInt(First(map, "bedrooms", "quartos")),
            ParseOperation(First(map, "operation", "operacao")));
    }

    public static Guid? ParsePropertyId(IEnumerable<KeyValuePair<string, string?>> values)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in values)
        {
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
                continue;
            map[key.Trim()] = value.Trim();
        }

        var raw = First(map, "id", "propertyId", "property_id");
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    private static string? First(IReadOnlyDictionary<string, string> map, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (map.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    private static decimal? ParseDecimal(string? raw) =>
        decimal.TryParse(raw, System.Globalization.NumberStyles.Number,
            System.Globalization.CultureInfo.InvariantCulture, out var value)
            ? value
            : null;

    private static int? ParseInt(string? raw) => int.TryParse(raw, out var value) ? value : null;

    private static PropertyOperation? ParseOperation(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return raw.Trim().ToLowerInvariant() switch
        {
            "rent" or "alugar" or "aluguel" => PropertyOperation.Rent,
            "sale" or "comprar" or "venda" => PropertyOperation.Sale,
            _ => null
        };
    }
}
