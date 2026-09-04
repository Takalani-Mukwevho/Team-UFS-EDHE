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
            context.Logger.LogInformation("Processing funding decision...");

            string? pathId = null;
            string? qsId = null;
            request.PathParameters?.TryGetValue("invoiceId", out pathId);
            request.QueryStringParameters?.TryGetValue("invoiceId", out qsId);
            var invoiceId = pathId ?? qsId;

            if (string.IsNullOrEmpty(invoiceId))
            {
                return CreateResponse(400, "Invoice ID is required");
            }

            var invoice = await _dynamoService.GetInvoiceAsync(invoiceId);
            if (invoice == null)
            {
                return CreateResponse(404, "Invoice not found");
            }

            if (invoice.Status != InvoiceStatus.Verified)
            {
                return CreateResponse(400, $"Invoice must be verified before funding. Current status: {invoice.Status}");
            }

            var buyer = await _dynamoService.GetBuyerAsync(invoice.BuyerId);
            var sme = await _dynamoService.GetSMEAsync(invoice.SmeId);

            if (buyer == null || sme == null)
            {
                return CreateResponse(400, "Buyer or SME data not found");
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
                context.Logger.LogWarning($"Bedrock summary failed (non-critical): {ex.Message}");
            }

            invoice.FundingDecision = fundingDecision;
            invoice.Status = fundingDecision.Outcome == Decision.Approved
                ? InvoiceStatus.Funded
                : InvoiceStatus.Rejected;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _dynamoService.SaveInvoiceAsync(invoice);

            return CreateResponse(200, JsonSerializer.Serialize(new
            {
                invoiceId = invoice.InvoiceId,
                status = invoice.Status.ToString(),
                fundingDecision = fundingDecision
            }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error processing funding: {ex.Message}");
            return CreateResponse(500, $"Error processing funding: {ex.Message}");
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
                { "Access-Control-Allow-Origin", "*" }
            },
            Body = body
        };
    }
}
