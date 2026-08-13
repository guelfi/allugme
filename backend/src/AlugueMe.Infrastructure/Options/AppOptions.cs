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
    public string SaasAdminEmail { get; set; } = "contato@allugme.com.br";
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
    /// <summary>Overrides de e-mail por tenant: {EmailTemplatesPath}/{tenantId}/{template}.html</summary>
    public string EmailTemplatesPath { get; set; } = "storage/email-templates";
}

/// <summary>URLs públicas usadas em links de e-mail (reset de senha, convites).</summary>
public class AppPublicOptions
{
    public const string SectionName = "App";
    /// <summary>Base do painel, sem barra final — ex.: https://www.allugme.com.br/allugme</summary>
    public string DashboardBaseUrl { get; set; } = "https://www.allugme.com.br/allugme";
}

public class RedisOptions
{
    public const string SectionName = "Redis";
    public string KeyPrefix { get; set; } = "alugueme:";
}

/// <summary>Chave Pix estática usada para receber os pagamentos de assinatura (sem gateway/PSP).</summary>
public class PixOptions
{
    public const string SectionName = "Pix";
    /// <summary>Chave Pix no formato aceito pelo Bacen (ex.: telefone em E.164 "+5511999999999").</summary>
    public string Key { get; set; } = string.Empty;
    public string MerchantName { get; set; } = "ALLUGME";
    public string MerchantCity { get; set; } = "SAO PAULO";
}

/// <summary>Configuração SMTP para envio de e-mails transacionais (opcional; se Host vazio, envio é ignorado).</summary>
public class EmailOptions
{
    public const string SectionName = "Smtp";
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = true;
    public string FromAddress { get; set; } = "no-reply@allugme.com.br";
    public string FromName { get; set; } = "Allugme";
}
