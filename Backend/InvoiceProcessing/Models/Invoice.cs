using System.Text.Json.Serialization;

namespace InvoiceProcessing.Models;

public class Invoice
{
    [JsonPropertyName("invoiceId")]
    public string InvoiceId { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("smeId")]
    public string SmeId { get; set; } = string.Empty;

    [JsonPropertyName("buyerId")]
    public string BuyerId { get; set; } = string.Empty;

    [JsonPropertyName("invoiceNumber")]
    public string InvoiceNumber { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "ZAR";

    [JsonPropertyName("issueDate")]
    public DateTime IssueDate { get; set; }

    [JsonPropertyName("dueDate")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("status")]
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    [JsonPropertyName("s3Key")]
    public string S3Key { get; set; } = string.Empty;

    [JsonPropertyName("documentHash")]
    public string DocumentHash { get; set; } = string.Empty;

    [JsonPropertyName("extractedData")]
    public ExtractedData? ExtractedData { get; set; }

    [JsonPropertyName("fundingDecision")]
    public FundingDecision? FundingDecision { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ExtractedData
{
    [JsonPropertyName("vendorName")]
    public string VendorName { get; set; } = string.Empty;

    [JsonPropertyName("vendorAddress")]
    public string VendorAddress { get; set; } = string.Empty;

    [JsonPropertyName("buyerName")]
    public string BuyerName { get; set; } = string.Empty;

    [JsonPropertyName("buyerAddress")]
    public string BuyerAddress { get; set; } = string.Empty;

    [JsonPropertyName("invoiceNumber")]
    public string InvoiceNumber { get; set; } = string.Empty;

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("taxAmount")]
    public decimal TaxAmount { get; set; }

    [JsonPropertyName("subtotal")]
    public decimal Subtotal { get; set; }

    [JsonPropertyName("lineItems")]
    public List<LineItem> LineItems { get; set; } = new();

    [JsonPropertyName("rawText")]
    public string RawText { get; set; } = string.Empty;
}

public class LineItem
{
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("quantity")]
    public decimal Quantity { get; set; }

    [JsonPropertyName("unitPrice")]
    public decimal UnitPrice { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public enum InvoiceStatus
{
    Pending,
    Uploaded,
    Extracted,
    Verified,
    Funded,
    Rejected,
    Duplicate
}
