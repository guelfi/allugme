using AlugueMe.Api.Auth;
using AlugueMe.Application.Dtos.Themes;
using AlugueMe.Application.Interfaces;
using AlugueMe.Domain.Enums;
using AlugueMe.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlugueMe.Api.Controllers;

public record AdminStatsDto(int Agencies, int IndependentBrokers, int Properties, int Clients);

[ApiController]
[Route("api/v1/admin")]
[Authorize]
public class AdminController(AppDbContext db, ICustomThemePackage customThemes) : ControllerBase
{
    /// <summary>
    /// Totais globais da plataforma para o painel do SaaS Admin (somente leitura).
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats(CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var agencies = await db.Tenants.CountAsync(t => t.Type == TenantType.Agency, ct);
        var independents = await db.Tenants.CountAsync(t => t.Type == TenantType.Independent, ct);
        var properties = await db.Properties.CountAsync(ct);

        var clients = await db.Users.CountAsync(u => u.IsClient, ct);

        return Ok(new AdminStatsDto(agencies, independents, properties, clients));
    }

    [HttpGet("theme-submissions")]
    public async Task<ActionResult<IReadOnlyList<CustomThemeSubmissionDto>>> ListThemeSubmissions(
        [FromQuery] string? status,
        CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var query = db.CustomThemeSubmissions.Include(s => s.Tenant).AsQueryable();
        if (Enum.TryParse<CustomThemeStatus>(status, true, out var parsed))
            query = query.Where(s => s.Status == parsed);

        var items = await query.OrderByDescending(s => s.SubmittedAt).Take(200).ToListAsync(ct);
        return Ok(items.Select(s => new CustomThemeSubmissionDto(
            s.Id, s.TenantId, s.Tenant.Name, s.Version, s.Status.ToString().ToLowerInvariant(),
            s.ThemeKey, s.OriginalFileName, s.ReviewNotes, s.SubmittedAt, s.ReviewedAt)).ToList());
    }

    [HttpPost("theme-submissions/{id:guid}/review")]
    public async Task<ActionResult<CustomThemeSubmissionDto>> ReviewTheme(
        Guid id,
        [FromBody] ReviewCustomThemeRequest request,
        CancellationToken ct)
    {
        if (!User.IsSaasAdmin())
            return Forbid();

        var submission = await db.CustomThemeSubmissions.Include(s => s.Tenant).FirstOrDefaultAsync(s => s.Id == id, ct);
        if (submission is null)
            return NotFound();

        var decision = (request.Decision ?? "").Trim().ToLowerInvariant();
        if (decision is not ("approve" or "approved" or "reject" or "rejected"))
            return BadRequest(new { message = "Decisão inválida. Use approve ou reject." });

        var approve = decision.StartsWith("approve", StringComparison.Ordinal);
        if (approve)
        {
            var pending = customThemes.GetPendingDirectory(submission.StorageFolder);
            if (!Directory.Exists(pending))
                return BadRequest(new { message = "Pacote pendente não encontrado para validação." });

            var live = customThemes.GetApprovedDirectory(submission.TenantId, submission.Version);
            if (Directory.Exists(live))
                Directory.Delete(live, true);
            CopyDirectory(pending, live);
            submission.Status = CustomThemeStatus.Approved;
        }
        else
        {
            submission.Status = CustomThemeStatus.Rejected;
            if (string.Equals(submission.Tenant.ThemeKey, submission.ThemeKey, StringComparison.OrdinalIgnoreCase))
                submission.Tenant.ThemeKey = "moderno";
        }

        submission.ReviewNotes = request.Notes;
        submission.ReviewedAt = DateTime.UtcNow;
        submission.ReviewedByUserId = User.GetUserId();
        await db.SaveChangesAsync(ct);

        return Ok(new CustomThemeSubmissionDto(
            submission.Id, submission.TenantId, submission.Tenant.Name, submission.Version,
            submission.Status.ToString().ToLowerInvariant(), submission.ThemeKey,
            submission.OriginalFileName, submission.ReviewNotes, submission.SubmittedAt, submission.ReviewedAt));
    }

    private static void CopyDirectory(string source, string destination)
    {
        Directory.CreateDirectory(destination);
        foreach (var dir in Directory.GetDirectories(source, "*", SearchOption.AllDirectories))
        {
            Directory.CreateDirectory(dir.Replace(source, destination, StringComparison.Ordinal));
        }

        foreach (var file in Directory.GetFiles(source, "*", SearchOption.AllDirectories))
        {
            var dest = file.Replace(source, destination, StringComparison.Ordinal);
            Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
            System.IO.File.Copy(file, dest, overwrite: true);
        }
    }
}
