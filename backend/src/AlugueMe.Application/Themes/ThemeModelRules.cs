namespace AlugueMe.Application.Themes;

public static class ThemeModelRules
{
    public static readonly IReadOnlyList<string> RequiredFiles =
    [
        "theme.json",
        "pages/home.html",
        "pages/listing.html",
        "pages/property.html",
        "pages/schedule.html",
        "partials/header.html",
        "partials/footer.html",
        "partials/property-card.html",
        "assets/css/main.css",
        "assets/js/main.js"
    ];

    public static readonly IReadOnlyList<string> RequiredPages = ["home", "listing", "property", "schedule"];

    public static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".html", ".css", ".js", ".json", ".svg", ".png", ".jpg", ".jpeg", ".webp",
        ".woff", ".woff2", ".ico", ".txt", ".md"
    };

    public const long MaxPackageBytes = 8 * 1024 * 1024;
}
