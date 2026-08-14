using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260814183000_ClientJourneyAndVisitFeedback")]
public partial class ClientJourneyAndVisitFeedback : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var name in new[] { "ConfirmedAt", "CancelledAt", "CompletedAt", "Reminder24hSentAt", "Reminder2hSentAt", "FeedbackRequestedAt" })
            migrationBuilder.AddColumn<DateTime>(name: name, table: "Visits", type: "timestamp with time zone", nullable: true);

        migrationBuilder.CreateTable(
            name: "VisitFeedbacks",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                VisitId = table.Column<Guid>(type: "uuid", nullable: false),
                ClientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                OverallRating = table.Column<int>(type: "integer", nullable: false),
                BrokerRating = table.Column<int>(type: "integer", nullable: false),
                InterestLevel = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                WantsContact = table.Column<bool>(type: "boolean", nullable: false),
                SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_VisitFeedbacks", x => x.Id);
                table.ForeignKey("FK_VisitFeedbacks_Users_ClientUserId", x => x.ClientUserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_VisitFeedbacks_Visits_VisitId", x => x.VisitId, "Visits", "Id", onDelete: ReferentialAction.Cascade);
            });
        migrationBuilder.CreateIndex("IX_VisitFeedbacks_VisitId", "VisitFeedbacks", "VisitId", unique: true);
        migrationBuilder.CreateIndex("IX_VisitFeedbacks_ClientUserId_SubmittedAt", "VisitFeedbacks", new[] { "ClientUserId", "SubmittedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("VisitFeedbacks");
        foreach (var name in new[] { "ConfirmedAt", "CancelledAt", "CompletedAt", "Reminder24hSentAt", "Reminder2hSentAt", "FeedbackRequestedAt" })
            migrationBuilder.DropColumn(name: name, table: "Visits");
    }
}
