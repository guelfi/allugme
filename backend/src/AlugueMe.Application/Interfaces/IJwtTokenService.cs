namespace AlugueMe.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(Guid userId, string email, string name, bool isSaasAdmin, Guid? tenantId, string? role, bool isClient = false);
}
