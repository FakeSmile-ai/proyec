using System.Text.Json.Serialization;

namespace MatchesService.Models.DTOs;

public class ProgramarPartidoDto
{
    [JsonPropertyName("homeTeamId")]
    public int HomeTeamId { get; set; }

    [JsonPropertyName("awayTeamId")]
    public int AwayTeamId { get; set; }

    [JsonPropertyName("dateMatch")]
    public DateTime DateMatch { get; set; }

    [JsonPropertyName("quarterDurationSeconds")]
    public int? QuarterDurationSeconds { get; set; }
}
