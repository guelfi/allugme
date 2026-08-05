using AlugueMe.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlugueMe.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260805150000_PropertyMediaTypeAndUserAvatar")]
public partial class PropertyMediaTypeAndUserAvatar : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "MediaType",
            table: "PropertyMedia",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "AvatarPath",
            table: "Users",
            type: "character varying(300)",
            maxLength: 300,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "MediaType", table: "PropertyMedia");
        migrationBuilder.DropColumn(name: "AvatarPath", table: "Users");
    }
}
