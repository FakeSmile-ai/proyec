using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatchesService.Migrations
{
    /// <inheritdoc />
    public partial class DateMatchUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DateMatch",
                table: "Matches",
                newName: "DateMatchUtc");

            migrationBuilder.RenameIndex(
                name: "IX_Matches_DateMatch",
                table: "Matches",
                newName: "IX_Matches_DateMatchUtc");

            migrationBuilder.RenameIndex(
                name: "IX_Matches_Status_DateMatch",
                table: "Matches",
                newName: "IX_Matches_Status_DateMatchUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Matches_Status_DateMatchUtc",
                table: "Matches",
                newName: "IX_Matches_Status_DateMatch");

            migrationBuilder.RenameIndex(
                name: "IX_Matches_DateMatchUtc",
                table: "Matches",
                newName: "IX_Matches_DateMatch");

            migrationBuilder.RenameColumn(
                name: "DateMatchUtc",
                table: "Matches",
                newName: "DateMatch");
        }
    }
}
