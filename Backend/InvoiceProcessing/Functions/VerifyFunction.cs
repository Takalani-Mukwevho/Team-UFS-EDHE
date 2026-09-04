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
            context.Logger.LogInformation("Processing invoice verification...");

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

            var verificationResult = await _verificationService.VerifyAsync(invoice);

            invoice.Status = verificationResult.IsValid
                ? InvoiceStatus.Verified
                : InvoiceStatus.Rejected;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _dynamoService.SaveInvoiceAsync(invoice);

            return CreateResponse(200, JsonSerializer.Serialize(new
            {
                invoiceId = invoice.InvoiceId,
                status = invoice.Status.ToString(),
                verification = verificationResult
            }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error verifying invoice: {ex.Message}");
            return CreateResponse(500, $"Error verifying invoice: {ex.Message}");
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
