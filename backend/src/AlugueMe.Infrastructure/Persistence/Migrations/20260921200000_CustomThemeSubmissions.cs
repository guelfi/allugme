using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260921200000_CustomThemeSubmissions")]
public partial class CustomThemeSubmissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CustomThemeSubmissions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                Version = table.Column<int>(type: "integer", nullable: false),
                Status = table.Column<int>(type: "integer", nullable: false),
                OriginalFileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                StorageFolder = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                ReviewNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                ReviewedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CustomThemeSubmissions", x => x.Id);
                table.ForeignKey(
                    name: "FK_CustomThemeSubmissions_Tenants_TenantId",
                    column: x => x.TenantId,
                    principalTable: "Tenants",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CustomThemeSubmissions_Status",
            table: "CustomThemeSubmissions",
            column: "Status");

        migrationBuilder.CreateIndex(
            name: "IX_CustomThemeSubmissions_TenantId_Version",
            table: "CustomThemeSubmissions",
            columns: ["TenantId", "Version"],
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CustomThemeSubmissions");
    }
}
