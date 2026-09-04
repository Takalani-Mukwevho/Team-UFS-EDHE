using System.Text.Json.Serialization;

namespace InvoiceProcessing.Models;

public class SME
{
    [JsonPropertyName("smeId")]
    public string SmeId { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyName")]
    public string CompanyName { get; set; } = string.Empty;

    [JsonPropertyName("registrationNumber")]
    public string RegistrationNumber { get; set; } = string.Empty;

    [JsonPropertyName("industry")]
    public string Industry { get; set; } = string.Empty;

    [JsonPropertyName("yearsInOperation")]
    public int YearsInOperation { get; set; }

    [JsonPropertyName("annualRevenue")]
    public decimal AnnualRevenue { get; set; }

    [JsonPropertyName("contactEmail")]
    public string ContactEmail { get; set; } = string.Empty;

    [JsonPropertyName("contactPhone")]
    public string ContactPhone { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("bankAccountNumber")]
    public string BankAccountNumber { get; set; } = string.Empty;

    [JsonPropertyName("isVerified")]
    public bool IsVerified { get; set; }

    [JsonPropertyName("verificationDate")]
    public DateTime? VerificationDate { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
