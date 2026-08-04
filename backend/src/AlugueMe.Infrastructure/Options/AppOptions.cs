namespace AlugueMe.Infrastructure.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "AlugueMe";
    public string Audience { get; set; } = "AlugueMe";
    public string Secret { get; set; } = string.Empty;
    public int ExpirationHours { get; set; } = 24;
}

public class EvolutionOptions
{
    public const string SectionName = "Evolution";
    public bool Enabled { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
}

public class SeedOptions
{
    public const string SectionName = "Seed";
    public bool Enabled { get; set; }
    public string DemoPassword { get; set; } = "Demo@123456";
    public string SaasAdminEmail { get; set; } = "admin@allugme.com.br";
    public string SaasAdminPassword { get; set; } = "Admin123#";
}

public class ThemesOptions
{
    public const string SectionName = "Themes";
    public string RootPath { get; set; } = "../../themes/official";
}

public class StorageOptions
{
    public const string SectionName = "Storage";
    public string MediaPath { get; set; } = "storage/media";
    public string PublicBaseUrl { get; set; } = "/media";
}

public class RedisOptions
{
    public const string SectionName = "Redis";
    public string KeyPrefix { get; set; } = "alugueme:";
}
