using AlugueMe.Domain.Enums;

namespace AlugueMe.Infrastructure.Persistence.Seed;

public sealed record DemoListing(
    string TenantSlug,
    string Title,
    string Description,
    PropertyOperation Operation,
    decimal Price,
    int Bedrooms,
    decimal AreaSqm,
    PropertyType PropertyType,
    string City,
    string Neighborhood,
    string PhotoFile);

public static class DemoListingCatalog
{
    public static readonly IReadOnlyList<DemoListing> All =
    [
        new("horizon", "Studio com varanda na Vila Madalena",
            "Studio reformado, pé-direito alto, varanda e mobília planejada a duas quadras da Augusta.",
            PropertyOperation.Rent, 3100m, 1, 42m, PropertyType.Studio, "São Paulo", "Vila Madalena", "listing-01.jpg"),
        new("horizon", "Apartamento 3 dormitórios no Itaim Bibi",
            "Sala integrada, suíte master e 2 vagas. Prédio com lazer completo perto da Faria Lima.",
            PropertyOperation.Sale, 1_680_000m, 3, 112m, PropertyType.Apartment, "São Paulo", "Itaim Bibi", "listing-02.jpg"),
        new("horizon", "Casa com quintal na Vila Romana",
            "Casa de vila com 4 dormitórios, churrasqueira e vaga para 2 carros em rua arborizada.",
            PropertyOperation.Rent, 7800m, 4, 210m, PropertyType.House, "São Paulo", "Vila Romana", "listing-03.jpg"),

        new("vista-urbana", "Loft industrial na Vila Olímpia",
            "Loft com mezanino, cozinha americana e vista para o skyline da região da Berrini.",
            PropertyOperation.Rent, 4200m, 1, 55m, PropertyType.Studio, "São Paulo", "Vila Olímpia", "listing-04.jpg"),
        new("vista-urbana", "Garden com terraço no Brooklin",
            "Garden de 2 suítes, terraço privativo e churrasqueira. Condomínio silencioso.",
            PropertyOperation.Sale, 1_320_000m, 2, 88m, PropertyType.Apartment, "São Paulo", "Brooklin", "listing-05.jpg"),
        new("vista-urbana", "Cobertura duplex na Berrini",
            "Cobertura com terraço gourmet, 3 suítes e vista panorâmica. Aceita pet.",
            PropertyOperation.Rent, 9500m, 3, 145m, PropertyType.Apartment, "São Paulo", "Brooklin Novo", "listing-06.jpg"),

        new("casa-tradicao", "Sobrado clássico em Higienópolis",
            "Sobrado dos anos 50 restaurado, pisos originais, 4 suítes e jardim interno.",
            PropertyOperation.Rent, 8900m, 4, 240m, PropertyType.House, "São Paulo", "Higienópolis", "listing-07.jpg"),
        new("casa-tradicao", "Apartamento de frente para o parque",
            "Living amplo, 3 suítes e sacada linear com vista permanente para o parque.",
            PropertyOperation.Sale, 2_450_000m, 3, 156m, PropertyType.Apartment, "São Paulo", "Jardim Paulista", "listing-08.jpg"),
        new("casa-tradicao", "Casa térrea com jardim em Perdizes",
            "Casa térrea com jardim nos fundos, home office e garagem coberta para 2 carros.",
            PropertyOperation.Rent, 6200m, 3, 168m, PropertyType.House, "São Paulo", "Perdizes", "listing-09.jpg"),

        new("atlas", "Studio compacto na Consolação",
            "Studio otimizado, armários embutidos e portaria 24h a 5 minutos do metrô.",
            PropertyOperation.Rent, 2400m, 1, 28m, PropertyType.Studio, "São Paulo", "Consolação", "listing-10.jpg"),
        new("atlas", "Apartamento 2 suítes no Paraíso",
            "2 suítes, varanda gourmet e 1 vaga. Próximo a hospitais e ao Parque Ibirapuera.",
            PropertyOperation.Sale, 990_000m, 2, 74m, PropertyType.Apartment, "São Paulo", "Paraíso", "listing-11.jpg"),
        new("atlas", "Casa geminada no Campo Belo",
            "Casa geminada com quintal, 3 dormitórios e fácil acesso à Santo Amaro.",
            PropertyOperation.Rent, 5800m, 3, 130m, PropertyType.House, "São Paulo", "Campo Belo", "listing-12.jpg"),

        new("porto-lar", "Apartamento 2 dormitórios na Vila Mariana",
            "2 dormitórios, sacada e lavanderia privativa. Rua tranquila perto da Ana Rosa.",
            PropertyOperation.Rent, 3900m, 2, 68m, PropertyType.Apartment, "São Paulo", "Vila Mariana", "listing-13.jpg"),
        new("porto-lar", "Cobertura com vista para o Ibirapuera",
            "Cobertura com living envidraçado, 3 suítes e vista aberta para o parque.",
            PropertyOperation.Sale, 1_750_000m, 3, 128m, PropertyType.Apartment, "São Paulo", "Moema", "listing-14.jpg"),
        new("porto-lar", "Casa de vila no Sumaré",
            "Casa de vila reformada, 3 dormitórios, área gourmet e 1 vaga descoberta.",
            PropertyOperation.Rent, 5100m, 3, 118m, PropertyType.House, "São Paulo", "Sumaré", "listing-15.jpg"),
    ];

    public static IReadOnlyList<DemoListing> ForTenant(string slug) =>
        All.Where(item => item.TenantSlug == slug).ToList();
}
