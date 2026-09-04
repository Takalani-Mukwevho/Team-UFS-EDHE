using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using InvoiceProcessing.Models;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace InvoiceProcessing.Services;

public class BedrockService : IBedrockService
{
    private readonly IAmazonBedrockRuntime _bedrockClient;
    private readonly string _modelId;

    public BedrockService()
    {
        _bedrockClient = new AmazonBedrockRuntimeClient();
        _modelId = Environment.GetEnvironmentVariable("BEDROCK_MODEL_ID") ?? "anthropic.claude-3-haiku-20240307-v1:0";
    }

    public BedrockService(IAmazonBedrockRuntime bedrockClient)
    {
        _bedrockClient = bedrockClient;
        _modelId = Environment.GetEnvironmentVariable("BEDROCK_MODEL_ID") ?? "anthropic.claude-3-haiku-20240307-v1:0";
    }

    public async Task<string> GenerateFundingSummaryAsync(
        Invoice invoice, Buyer buyer, SME sme, FundingDecision decision)
    {
        var prompt = BuildPrompt(invoice, buyer, sme, decision);

        var bodyJson = JsonSerializer.Serialize(new
        {
            prompt = prompt,
            max_tokens = 512,
            temperature = 0.7,
            top_p = 0.9
        });
        var bodyStream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(bodyJson));

        var request = new InvokeModelRequest
        {
            ModelId = _modelId,
            ContentType = "application/json",
            Accept = "application/json",
            Body = bodyStream
        };

        var response = await _bedrockClient.InvokeModelAsync(request);
        using var reader = new StreamReader(response.Body);
        var responseBody = await reader.ReadToEndAsync();
        var result = JsonSerializer.Deserialize<BedrockResponse>(responseBody);

        return result?.Completion ?? "Unable to generate summary";
    }

    private string BuildPrompt(Invoice invoice, Buyer buyer, SME sme, FundingDecision decision)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are a financial analyst providing a funding recommendation summary.");
        sb.AppendLine();
        sb.AppendLine("## Invoice Details");
        sb.AppendLine($"- Invoice Number: {invoice.InvoiceNumber}");
        sb.AppendLine($"- Amount: {invoice.Currency} {invoice.Amount:N2}");
        sb.AppendLine($"- Issue Date: {invoice.IssueDate:yyyy-MM-dd}");
        sb.AppendLine($"- Due Date: {invoice.DueDate:yyyy-MM-dd}");
        sb.AppendLine();
        sb.AppendLine("## SME Information");
        sb.AppendLine($"- Company: {sme.CompanyName}");
        sb.AppendLine($"- Industry: {sme.Industry}");
        sb.AppendLine($"- Years in Operation: {sme.YearsInOperation}");
        sb.AppendLine($"- Annual Revenue: {sme.AnnualRevenue:N2}");
        sb.AppendLine();
        sb.AppendLine("## Buyer Information");
        sb.AppendLine($"- Company: {buyer.CompanyName}");
        sb.AppendLine($"- Credit Rating: {buyer.CreditRating}");
        sb.AppendLine($"- Average Payment Days: {buyer.PaymentHistory.AveragePaymentDays}");
        sb.AppendLine();
        sb.AppendLine("## Risk Assessment");
        sb.AppendLine($"- Overall Risk Score: {decision.RiskScore.Overall}");
        sb.AppendLine($"- Decision: {decision.Outcome}");
        sb.AppendLine($"- Approved Amount: {invoice.Currency} {decision.ApprovedAmount:N2}");
        sb.AppendLine();
        sb.AppendLine("Please provide a concise, professional summary of this funding decision including:");
        sb.AppendLine("1. Key factors influencing the decision");
        sb.AppendLine("2. Risk highlights");
        sb.AppendLine("3. Recommendation rationale");

        return sb.ToString();
    }
}

internal class BedrockResponse
{
    [JsonPropertyName("completion")]
    public string? Completion { get; set; }
}
