using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260814184500_ClientEmailVerification")]
public partial class ClientEmailVerification : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(name: "EmailVerifiedAt", table: "Users", type: "timestamp with time zone", nullable: true);
        migrationBuilder.CreateTable(
            name: "EmailVerificationTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EmailVerificationTokens", x => x.Id);
                table.ForeignKey(name: "FK_EmailVerificationTokens_Users_UserId", column: x => x.UserId, principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            });
        migrationBuilder.CreateIndex(name: "IX_EmailVerificationTokens_TokenHash", table: "EmailVerificationTokens", column: "TokenHash", unique: true);
        migrationBuilder.CreateIndex(name: "IX_EmailVerificationTokens_UserId_ExpiresAt", table: "EmailVerificationTokens", columns: new[] { "UserId", "ExpiresAt" });
        migrationBuilder.Sql("UPDATE \"Users\" SET \"EmailVerifiedAt\" = \"CreatedAt\" WHERE \"IsClient\" = TRUE;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "EmailVerificationTokens");
        migrationBuilder.DropColumn(name: "EmailVerifiedAt", table: "Users");
    }
}
