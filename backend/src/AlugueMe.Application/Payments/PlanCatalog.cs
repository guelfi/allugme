namespace AlugueMe.Application.Payments;

/// <summary>Fonte única dos valores dos planos, espelhando frontend/dashboard/src/pricing.ts.</summary>
public static class PlanCatalog
{
    public static bool IsIndependent(string accountType) =>
        accountType.Trim().ToLowerInvariant() is "independent" or "corretor" or "broker";

    public static decimal GetAmount(string accountType, string plan)
    {
        var isYearly = plan.Trim().ToLowerInvariant() == "yearly";
        return IsIndependent(accountType)
            ? (isYearly ? 490m : 49m)
            : (isYearly ? 900m : 99m);
    }

    public static string GetLabel(string accountType, string plan)
    {
        var isIndependent = IsIndependent(accountType);
        var isYearly = plan.Trim().ToLowerInvariant() == "yearly";
        return isIndependent
            ? (isYearly
                ? "Anual (R$ 490,00) — corretor independente"
                : "Mensal (R$ 49,00) — corretor independente")
            : isYearly
                ? "Anual (R$ 900,00) — até 5 corretores; extra R$ 190,00/ano por corretor"
                : "Mensal (R$ 99,00) — até 5 corretores; extra R$ 39,00/mês por corretor";
    }
}
