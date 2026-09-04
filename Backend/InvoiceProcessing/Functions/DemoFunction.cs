using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using InvoiceProcessing.Models;
using InvoiceProcessing.Services;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class DemoFunction
{
    private readonly UploadFunction _uploadFunction;
    private readonly VerifyFunction _verifyFunction;
    private readonly FundFunction _fundFunction;
    private readonly IDynamoService _dynamoService;

    public DemoFunction()
    {
        _uploadFunction = new UploadFunction();
        _verifyFunction = new VerifyFunction();
        _fundFunction = new FundFunction();
        _dynamoService = new DynamoService();
    }

    public DemoFunction(
        UploadFunction uploadFunction,
        VerifyFunction verifyFunction,
        FundFunction fundFunction,
        IDynamoService dynamoService)
    {
        _uploadFunction = uploadFunction;
        _verifyFunction = verifyFunction;
        _fundFunction = fundFunction;
        _dynamoService = dynamoService;
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Starting demo end-to-end processing...");

            var results = new List<DemoResult>();

            var demoInvoices = GetDemoInvoices();

            foreach (var demoInvoice in demoInvoices)
            {
                context.Logger.LogInformation($"Processing demo invoice: {demoInvoice.InvoiceNumber}");
                var result = await ProcessDemoInvoice(demoInvoice, context);
                results.Add(result);
            }

            return CreateResponse(200, JsonSerializer.Serialize(new
            {
                status = "completed",
                processedCount = results.Count,
                results = results
            }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error in demo processing: {ex.Message}");
            return CreateResponse(500, $"Error in demo processing: {ex.Message}");
        }
    }

    private async Task<DemoResult> ProcessDemoInvoice(Invoice demoInvoice, ILambdaContext context)
    {
        var result = new DemoResult
        {
            InvoiceNumber = demoInvoice.InvoiceNumber,
            StartTime = DateTime.UtcNow
        };

        try
        {
            context.Logger.LogInformation($"[Demo] Uploading invoice {demoInvoice.InvoiceNumber}...");
            demoInvoice.Status = InvoiceStatus.Uploaded;
            await _dynamoService.SaveInvoiceAsync(demoInvoice);
            result.UploadStatus = "success";

            context.Logger.LogInformation($"[Demo] Verifying invoice {demoInvoice.InvoiceNumber}...");
            demoInvoice.Status = InvoiceStatus.Verified;
            await _dynamoService.SaveInvoiceAsync(demoInvoice);
            result.VerificationStatus = "success";

            context.Logger.LogInformation($"[Demo] Processing funding for {demoInvoice.InvoiceNumber}...");
            demoInvoice.FundingDecision = new FundingDecision
            {
                InvoiceId = demoInvoice.InvoiceId,
                Outcome = Decision.Approved,
                ApprovedAmount = demoInvoice.Amount * 0.85m,
                FundingRate = 0.85m,
                RiskScore = new RiskScore
                {
                    Overall = 0.72m,
                    BuyerRisk = 0.25m,
                    SME = 0.35m,
                    InvoiceRisk = 0.20m
                }
            };
            demoInvoice.Status = InvoiceStatus.Funded;
            await _dynamoService.SaveInvoiceAsync(demoInvoice);
            result.FundingStatus = "success";

            result.Outcome = "Approved";
            result.EndTime = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            result.Error = ex.Message;
            result.EndTime = DateTime.UtcNow;
        }

        return result;
    }

    private List<Invoice> GetDemoInvoices()
    {
        return new List<Invoice>
        {
            new Invoice
            {
                InvoiceId = "demo-inv-001",
                InvoiceNumber = "INV-2024-001",
                SmeId = "sme-001",
                BuyerId = "buyer-001",
                Amount = 150000m,
                Currency = "ZAR",
                IssueDate = DateTime.UtcNow.AddDays(-5),
                DueDate = DateTime.UtcNow.AddDays(25),
                Status = InvoiceStatus.Pending
            },
            new Invoice
            {
                InvoiceId = "demo-inv-002",
                InvoiceNumber = "INV-2024-002",
                SmeId = "sme-002",
                BuyerId = "buyer-002",
                Amount = 275000m,
                Currency = "ZAR",
                IssueDate = DateTime.UtcNow.AddDays(-3),
                DueDate = DateTime.UtcNow.AddDays(27),
                Status = InvoiceStatus.Pending
            },
            new Invoice
            {
                InvoiceId = "demo-inv-003",
                InvoiceNumber = "INV-2024-003",
                SmeId = "sme-001",
                BuyerId = "buyer-003",
                Amount = 89500m,
                Currency = "ZAR",
                IssueDate = DateTime.UtcNow.AddDays(-7),
                DueDate = DateTime.UtcNow.AddDays(23),
                Status = InvoiceStatus.Pending
            }
        };
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

public class DemoResult
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string UploadStatus { get; set; } = "pending";
    public string VerificationStatus { get; set; } = "pending";
    public string FundingStatus { get; set; } = "pending";
    public string Outcome { get; set; } = string.Empty;
    public string? Error { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
