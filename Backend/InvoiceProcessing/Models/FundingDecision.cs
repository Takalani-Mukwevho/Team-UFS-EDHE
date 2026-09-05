using System.Text.Json.Serialization;

namespace InvoiceProcessing.Models;

public class FundingDecision
{
    [JsonPropertyName("decisionId")]
    public string DecisionId { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("invoiceId")]
    public string InvoiceId { get; set; } = string.Empty;

    [JsonPropertyName("decision")]
    public Decision Outcome { get; set; } = Decision.Pending;

    [JsonPropertyName("approvedAmount")]
    public decimal ApprovedAmount { get; set; }

    [JsonPropertyName("fundingRate")]
    public decimal FundingRate { get; set; }

    [JsonPropertyName("riskScore")]
    public RiskScore RiskScore { get; set; } = new();

    [JsonPropertyName("conditions")]
    public List<string> Conditions { get; set; } = new();

    [JsonPropertyName("rejectionReason")]
    public string? RejectionReason { get; set; }

    [JsonPropertyName("aiSummary")]
    public string? AiSummary { get; set; }

    [JsonPropertyName("decidedAt")]
    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;
}

public class RiskScore
{
    [JsonPropertyName("overall")]
    public decimal Overall { get; set; }

    [JsonPropertyName("buyerRisk")]
    public decimal BuyerRisk { get; set; }

    [JsonPropertyName("smeRisk")]
    public decimal SME { get; set; }

    [JsonPropertyName("invoiceRisk")]
    public decimal InvoiceRisk { get; set; }

    [JsonPropertyName("factors")]
    public List<RiskFactor> Factors { get; set; } = new();
}

public class RiskFactor
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("impact")]
    public decimal Impact { get; set; }

    [JsonPropertyName("isPositive")]
    public bool IsPositive { get; set; }
}

public enum Decision
{
    Pending,
    Approved,
    ConditionalApproval,
    Rejected
}

// Recorded when the SME accepts the advance and the funds are paid out.
// This is separate from the desk decision: an invoice can be approved by the
// credit desk but not yet disbursed until the SME accepts the offer.
public class Disbursement
{
    [JsonPropertyName("advance")]
    public decimal Advance { get; set; }

    [JsonPropertyName("fee")]
    public decimal Fee { get; set; }

    [JsonPropertyName("net")]
    public decimal Net { get; set; }

    [JsonPropertyName("fundingRate")]
    public decimal FundingRate { get; set; }

    [JsonPropertyName("acceptedAt")]
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
}
