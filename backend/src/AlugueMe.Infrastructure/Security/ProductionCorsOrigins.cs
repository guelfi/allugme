namespace AlugueMe.Infrastructure.Security;

/// <summary>
/// Origins explícitas usadas em todos os ambientes. Em Development o CORS
/// aceita também qualquer origem HTTP(S) de LAN privada; em Production
/// vale só esta lista (comportamento anterior do Program.cs).
/// </summary>
public static class ProductionCorsOrigins
{
    public static readonly string[] Values =
    [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.15.119",
        "http://129.153.86.168",
        "https://allugme.com.br",
        "https://www.allugme.com.br",
        "https://allugme.online",
        "https://www.allugme.online",
        "https://app.allugme.online"
    ];
}
