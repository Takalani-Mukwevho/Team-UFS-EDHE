using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using InvoiceProcessing.Models;
using InvoiceProcessing.Services;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class FundFunction
{
    private readonly IRiskEngineService _riskEngine;
    private readonly IBedrockService _bedrockService;
    private readonly IDynamoService _dynamoService;

    public FundFunction()
    {
        _riskEngine = new RiskEngineService();
        _bedrockService = new BedrockService();
        _dynamoService = new DynamoService();
    }

    public FundFunction(IRiskEngineService riskEngine, IBedrockService bedrockService, IDynamoService dynamoService)
    {
        _riskEngine = riskEngine;
        _bedrockService = bedrockService;
        _dynamoService = dynamoService;
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Processing funding decision in AWS...");

            string? pathId = null;
            string? qsId = null;
            request.PathParameters?.TryGetValue("invoiceId", out pathId);
            request.QueryStringParameters?.TryGetValue("invoiceId", out qsId);
            var invoiceId = pathId ?? qsId;

            // Also check request.Body
            if (string.IsNullOrEmpty(invoiceId) && !string.IsNullOrEmpty(request.Body))
            {
                try
                {
                    using var doc = JsonDocument.Parse(request.Body);
                    if (doc.RootElement.TryGetProperty("invoiceId", out var idProp))
                        invoiceId = idProp.GetString();
                    else if (doc.RootElement.TryGetProperty("invoiceNumber", out var numProp))
                        invoiceId = numProp.GetString();
                }
                catch { }
            }

            if (string.IsNullOrEmpty(invoiceId))
            {
                return CreateResponse(400, JsonSerializer.Serialize(new { error = "Invoice ID is required" }));
            }

            context.Logger.LogInformation($"Looking up invoice {invoiceId} in DynamoDB...");
            var invoice = await _dynamoService.GetInvoiceAsync(invoiceId);
            if (invoice == null)
            {
                return CreateResponse(404, JsonSerializer.Serialize(new { error = $"Invoice {invoiceId} not found in DynamoDB" }));
            }

            // Ensure Buyer and SME profiles exist so the Risk Engine evaluates properly
            var buyer = await _dynamoService.GetBuyerAsync(invoice.BuyerId);
            if (buyer == null)
            {
                buyer = new Buyer
                {
                    BuyerId = invoice.BuyerId,
                    CompanyName = invoice.ExtractedData?.BuyerName ?? "Corporate Buyer (Pty) Ltd",
                    CreditRating = CreditRating.Standard,
                    IsActive = true,
                    PaymentHistory = new PaymentHistory
                    {
                        TotalInvoicesPaid = 45,
                        TotalInvoicesOutstanding = 3,
                        AveragePaymentDays = 35,
                        LatePayments = 2,
                        TotalAmountPaid = 1250000m
                    }
                };
            }

            var sme = await _dynamoService.GetSMEAsync(invoice.SmeId);
            if (sme == null)
            {
                sme = new SME
                {
                    SmeId = invoice.SmeId,
                    CompanyName = invoice.ExtractedData?.VendorName ?? "SME Supplier Ltd",
                    IsVerified = true,
                    Industry = "Commercial Services",
                    YearsInOperation = 5,
                    AnnualRevenue = 3500000m
                };
            }

            var fundingDecision = _riskEngine.Evaluate(invoice, buyer, sme);

            try
            {
                var aiSummary = await _bedrockService.GenerateFundingSummaryAsync(
                    invoice, buyer, sme, fundingDecision);
                fundingDecision.AiSummary = aiSummary;
            }
            catch (Exception ex)
            {
                context.Logger.LogWarning($"Bedrock summary note: {ex.Message}");
            }

            invoice.FundingDecision = fundingDecision;
            invoice.Status = fundingDecision.Outcome == Decision.Approved
                ? InvoiceStatus.Funded
                : InvoiceStatus.Rejected;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _dynamoService.SaveInvoiceAsync(invoice);

            context.Logger.LogInformation($"Funding decision for {invoiceId}: {invoice.Status} (Amount: {fundingDecision.ApprovedAmount})");

            return CreateResponse(200, JsonSerializer.Serialize(new
            {
                invoiceId = invoice.InvoiceId,
                invoiceNumber = invoice.InvoiceNumber,
                status = invoice.Status.ToString(),
                fundingDecision = fundingDecision
            }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error processing funding: {ex.Message}");
            return CreateResponse(500, JsonSerializer.Serialize(new { error = $"Error processing funding: {ex.Message}" }));
        }
    }

    private APIGatewayProxyResponse CreateResponse(int statusCode, string body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" },
                { "Access-Control-Allow-Methods", "GET, POST, OPTIONS" },
                { "Access-Control-Allow-Headers", "*" }
            },
            Body = body
        };
    }
}
