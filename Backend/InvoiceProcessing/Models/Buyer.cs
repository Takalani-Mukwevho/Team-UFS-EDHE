using System.Text.Json.Serialization;

namespace InvoiceProcessing.Models;

public class Buyer
{
    [JsonPropertyName("buyerId")]
    public string BuyerId { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyName")]
    public string CompanyName { get; set; } = string.Empty;

    [JsonPropertyName("registrationNumber")]
    public string RegistrationNumber { get; set; } = string.Empty;

    [JsonPropertyName("industry")]
    public string Industry { get; set; } = string.Empty;

    [JsonPropertyName("contactEmail")]
    public string ContactEmail { get; set; } = string.Empty;

    [JsonPropertyName("contactPhone")]
    public string ContactPhone { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("creditRating")]
    public CreditRating CreditRating { get; set; } = CreditRating.Standard;

    [JsonPropertyName("paymentHistory")]
    public PaymentHistory PaymentHistory { get; set; } = new();

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PaymentHistory
{
    [JsonPropertyName("totalInvoicesPaid")]
    public int TotalInvoicesPaid { get; set; }

    [JsonPropertyName("totalInvoicesOutstanding")]
    public int TotalInvoicesOutstanding { get; set; }

    [JsonPropertyName("averagePaymentDays")]
    public int AveragePaymentDays { get; set; }

    [JsonPropertyName("latePayments")]
    public int LatePayments { get; set; }

    [JsonPropertyName("totalAmountPaid")]
    public decimal TotalAmountPaid { get; set; }

    [JsonPropertyName("lastPaymentDate")]
    public DateTime? LastPaymentDate { get; set; }
}

public enum CreditRating
{
    Excellent,
    Good,
    Standard,
    BelowAverage,
    Poor
}
