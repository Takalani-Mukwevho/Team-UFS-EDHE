using System.Text.Json.Serialization;

namespace InvoiceProcessing.Models;

public class ExtractionCache
{
    [JsonPropertyName("cacheKey")]
    public string CacheKey { get; set; } = string.Empty;

    [JsonPropertyName("documentHash")]
    public string DocumentHash { get; set; } = string.Empty;

    [JsonPropertyName("s3Key")]
    public string S3Key { get; set; } = string.Empty;

    [JsonPropertyName("extractionResult")]
    public ExtractedData ExtractionResult { get; set; } = new();

    [JsonPropertyName("textractJobId")]
    public string? TextractJobId { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("expiresAt")]
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

    [JsonPropertyName("hitCount")]
    public int HitCount { get; set; }
}
