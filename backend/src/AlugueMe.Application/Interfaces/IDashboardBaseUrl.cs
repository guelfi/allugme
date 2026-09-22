namespace AlugueMe.Application.Interfaces;

/// <summary>Base canônica do painel, sem barra final (links de e-mail e vitrine).</summary>
public interface IDashboardBaseUrl
{
    string GetBaseUrl();
}
