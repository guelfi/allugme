using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260805200000_TenantTrialPeriod")]
public partial class TenantTrialPeriod : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "TrialEndsAt",
            table: "Tenants",
            type: "timestamp with time zone",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "TrialEndsAt", table: "Tenants");
    }
}
