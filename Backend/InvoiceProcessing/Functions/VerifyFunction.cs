using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using InvoiceProcessing.Models;
using InvoiceProcessing.Services;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class VerifyFunction
{
    private readonly IVerificationService _verificationService;
    private readonly IDynamoService _dynamoService;

    public VerifyFunction()
    {
        _verificationService = new VerificationService();
        _dynamoService = new DynamoService();
    }

    public VerifyFunction(IVerificationService verificationService, IDynamoService dynamoService)
    {
        _verificationService = verificationService;
        _dynamoService = dynamoService;
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Processing invoice verification in AWS...");

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

            var verificationResult = await _verificationService.VerifyAsync(invoice);

            invoice.Status = verificationResult.IsValid
                ? InvoiceStatus.Verified
                : InvoiceStatus.Rejected;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _dynamoService.SaveInvoiceAsync(invoice);

            context.Logger.LogInformation($"Invoice {invoiceId} verified successfully with status: {invoice.Status}");

            return CreateResponse(200, JsonSerializer.Serialize(new
            {
                invoiceId = invoice.InvoiceId,
                invoiceNumber = invoice.InvoiceNumber,
                status = invoice.Status.ToString(),
                verification = verificationResult
            }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error verifying invoice: {ex.Message}");
            return CreateResponse(500, JsonSerializer.Serialize(new { error = $"Error verifying invoice: {ex.Message}" }));
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
