using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260807010000_EmailLgpdPortal")]
public partial class EmailLgpdPortal : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsClient",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "Status",
            table: "TenantMemberships",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<bool>(
            name: "EmailNotifyEnabled",
            table: "TenantSettings",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<Guid>(
            name: "ClientUserId",
            table: "Visits",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "BrokerInviteTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_BrokerInviteTokens", x => x.Id);
                table.ForeignKey(
                    name: "FK_BrokerInviteTokens_Tenants_TenantId",
                    column: x => x.TenantId,
                    principalTable: "Tenants",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_BrokerInviteTokens_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AvailabilityRules",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                BrokerUserId = table.Column<Guid>(type: "uuid", nullable: true),
                DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                IsClosed = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AvailabilityRules", x => x.Id);
                table.ForeignKey(
                    name: "FK_AvailabilityRules_Tenants_TenantId",
                    column: x => x.TenantId,
                    principalTable: "Tenants",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_AvailabilityRules_Users_BrokerUserId",
                    column: x => x.BrokerUserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ConsentRecords",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Context = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                PolicyVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                SubjectEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: true),
                VisitId = table.Column<Guid>(type: "uuid", nullable: true),
                IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                UserAgent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ConsentRecords", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "FavoriteProperties",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FavoriteProperties", x => x.Id);
                table.ForeignKey(
                    name: "FK_FavoriteProperties_Properties_PropertyId",
                    column: x => x.PropertyId,
                    principalTable: "Properties",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_FavoriteProperties_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Visits_ClientUserId",
            table: "Visits",
            column: "ClientUserId");

        migrationBuilder.CreateIndex(
            name: "IX_BrokerInviteTokens_TokenHash",
            table: "BrokerInviteTokens",
            column: "TokenHash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_BrokerInviteTokens_UserId_ExpiresAt",
            table: "BrokerInviteTokens",
            columns: new[] { "UserId", "ExpiresAt" });

        migrationBuilder.CreateIndex(
            name: "IX_BrokerInviteTokens_TenantId",
            table: "BrokerInviteTokens",
            column: "TenantId");

        migrationBuilder.CreateIndex(
            name: "IX_AvailabilityRules_TenantId_BrokerUserId_DayOfWeek",
            table: "AvailabilityRules",
            columns: new[] { "TenantId", "BrokerUserId", "DayOfWeek" });

        migrationBuilder.CreateIndex(
            name: "IX_AvailabilityRules_BrokerUserId",
            table: "AvailabilityRules",
            column: "BrokerUserId");

        migrationBuilder.CreateIndex(
            name: "IX_ConsentRecords_Context_AcceptedAt",
            table: "ConsentRecords",
            columns: new[] { "Context", "AcceptedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_FavoriteProperties_UserId_PropertyId",
            table: "FavoriteProperties",
            columns: new[] { "UserId", "PropertyId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_FavoriteProperties_PropertyId",
            table: "FavoriteProperties",
            column: "PropertyId");

        migrationBuilder.AddForeignKey(
            name: "FK_Visits_Users_ClientUserId",
            table: "Visits",
            column: "ClientUserId",
            principalTable: "Users",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_Visits_Users_ClientUserId", table: "Visits");
        migrationBuilder.DropTable(name: "BrokerInviteTokens");
        migrationBuilder.DropTable(name: "AvailabilityRules");
        migrationBuilder.DropTable(name: "ConsentRecords");
        migrationBuilder.DropTable(name: "FavoriteProperties");
        migrationBuilder.DropIndex(name: "IX_Visits_ClientUserId", table: "Visits");
        migrationBuilder.DropColumn(name: "ClientUserId", table: "Visits");
        migrationBuilder.DropColumn(name: "EmailNotifyEnabled", table: "TenantSettings");
        migrationBuilder.DropColumn(name: "Status", table: "TenantMemberships");
        migrationBuilder.DropColumn(name: "IsClient", table: "Users");
    }
}
