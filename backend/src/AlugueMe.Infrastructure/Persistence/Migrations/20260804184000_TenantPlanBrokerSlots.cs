using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260804184000_TenantPlanBrokerSlots")]
public partial class TenantPlanBrokerSlots : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ExtraBrokerSlots",
            table: "Tenants",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "IncludedBrokerSlots",
            table: "Tenants",
            type: "integer",
            nullable: false,
            defaultValue: 5);

        migrationBuilder.AddColumn<string>(
            name: "Plan",
            table: "Tenants",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "monthly");

        migrationBuilder.Sql("""UPDATE "Tenants" SET "IncludedBrokerSlots" = 1 WHERE "Type" = 1;""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ExtraBrokerSlots", table: "Tenants");
        migrationBuilder.DropColumn(name: "IncludedBrokerSlots", table: "Tenants");
        migrationBuilder.DropColumn(name: "Plan", table: "Tenants");
    }
}
