using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using InvoiceProcessing.Services;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class QueryFunction
{
    private readonly IDynamoService _dynamoService;

    public QueryFunction()
    {
        _dynamoService = new DynamoService();
    }

    public QueryFunction(IDynamoService dynamoService)
    {
        _dynamoService = dynamoService;
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        JsonElement input, ILambdaContext context)
    {
        try
        {
            var method = "GET";
            var path = "/";
            string? body = null;

            // Debug: log the entire event
            var rawEvent = input.GetRawText();
            context.Logger.LogInformation($"EVENT: {rawEvent.Substring(0, Math.Min(rawEvent.Length, 500))}");

            // V2: Try requestContext.http.method first (most reliable for v2)
            if (input.TryGetProperty("requestContext", out var rc)
                && rc.TryGetProperty("http", out var http)
                && http.TryGetProperty("method", out var m)
                && m.ValueKind == JsonValueKind.String)
            {
                method = m.GetString() ?? "GET";
            }
            // V1: httpMethod
            else if (input.TryGetProperty("httpMethod", out var hm) && hm.ValueKind == JsonValueKind.String)
            {
                method = hm.GetString() ?? "GET";
            }

            // V2: rawPath (most reliable)
            if (input.TryGetProperty("rawPath", out var rp) && rp.ValueKind == JsonValueKind.String)
                path = rp.GetString() ?? path;
            // V1: path
            else if (input.TryGetProperty("path", out var p) && p.ValueKind == JsonValueKind.String)
                path = p.GetString() ?? path;

            // Body
            if (input.TryGetProperty("body", out var b) && b.ValueKind == JsonValueKind.String)
                body = b.GetString();

            context.Logger.LogInformation($"Processing: {method} {path}");

            // --- Invoice Status Update (persist decisions) ---
            if (path.StartsWith("/api/invoices/") && path.EndsWith("/status")
                && (method == "POST" || method == "PUT"))
            {
                var segments = path.Split('/');
                var invoiceId = segments.Length >= 4 ? segments[3] : "";
                if (string.IsNullOrEmpty(body))
                    return CreateResponse(400, new { error = "Missing request body" });

                var update = JsonSerializer.Deserialize<JsonElement>(body);
                var newStatus = update.TryGetProperty("status", out var s) ? s.GetString() ?? "" : "";
                var decisionJson = update.TryGetProperty("decision", out var d) ? d.GetRawText() : null;
                var disbursementJson = update.TryGetProperty("disbursement", out var dj) ? dj.GetRawText() : null;

                if (string.IsNullOrEmpty(newStatus))
                    return CreateResponse(400, new { error = "status is required" });

                var client = new AmazonDynamoDBClient();
                var table = Environment.GetEnvironmentVariable("INVOICE_TABLE_NAME") ?? "absaflow-invoices";

                var attributes = new Dictionary<string, AttributeValueUpdate>
                {
                    { "Status", new AttributeValueUpdate { Value = new AttributeValue { S = newStatus }, Action = AttributeAction.PUT } },
                    { "UpdatedAt", new AttributeValueUpdate { Value = new AttributeValue { S = DateTime.UtcNow.ToString("o") }, Action = AttributeAction.PUT } }
                };

                if (!string.IsNullOrEmpty(decisionJson))
                {
                    attributes["FundingDecision"] = new AttributeValueUpdate { Value = new AttributeValue { S = decisionJson }, Action = AttributeAction.PUT };
                }

                if (!string.IsNullOrEmpty(disbursementJson))
                {
                    attributes["Disbursement"] = new AttributeValueUpdate { Value = new AttributeValue { S = disbursementJson }, Action = AttributeAction.PUT };
                }

                await client.UpdateItemAsync(new UpdateItemRequest
                {
                    TableName = table,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        { "InvoiceId", new AttributeValue { S = invoiceId } }
                    },
                    AttributeUpdates = attributes,
                });

                context.Logger.LogInformation($"Updated invoice {invoiceId} status to {newStatus}");
                return CreateResponse(200, new { invoiceId, status = newStatus, updatedAt = DateTime.UtcNow.ToString("o") });
            }

            // --- GET Invoices ---
            if (path == "/api/invoices" && method == "GET")
            {
                var client = new AmazonDynamoDBClient();
                var table = Environment.GetEnvironmentVariable("INVOICE_TABLE_NAME") ?? "absaflow-invoices";
                var scanRes = await client.ScanAsync(new ScanRequest { TableName = table });
                var invoices = scanRes.Items.Select(DeserializeInvoice).ToList();
                return CreateResponse(200, new { invoices, count = invoices.Count });
            }

            if (path.StartsWith("/api/invoices/sme/") && method == "GET")
            {
                var smeId = path.Split('/').Last();
                var invoices = await _dynamoService.GetInvoicesBySmeAsync(smeId);
                return CreateResponse(200, new { invoices, count = invoices.Count });
            }

            if (path.StartsWith("/api/invoices/buyer/") && method == "GET")
            {
                var buyerId = path.Split('/').Last();
                var invoices = await _dynamoService.GetInvoicesByBuyerAsync(buyerId);
                return CreateResponse(200, new { invoices, count = invoices.Count });
            }

            if (path.StartsWith("/api/invoices/") && method == "GET")
            {
                var invoiceId = path.Split('/').Last();
                var invoice = await _dynamoService.GetInvoiceAsync(invoiceId);
                if (invoice == null)
                    return CreateResponse(404, new { error = "Invoice not found" });
                return CreateResponse(200, invoice);
            }

            // --- Buyers ---
            if (path == "/api/buyers" && method == "GET")
            {
                var client = new AmazonDynamoDBClient();
                var table = Environment.GetEnvironmentVariable("BUYER_TABLE_NAME") ?? "absaflow-buyers";
                var scanRes = await client.ScanAsync(new ScanRequest { TableName = table });
                var buyers = scanRes.Items.Select(DeserializeBuyer).ToList();
                return CreateResponse(200, new { buyers, count = buyers.Count });
            }

            if (path.StartsWith("/api/buyers/") && method == "GET")
            {
                var buyerId = path.Split('/').Last();
                var buyer = await _dynamoService.GetBuyerAsync(buyerId);
                if (buyer == null)
                    return CreateResponse(404, new { error = "Buyer not found" });
                return CreateResponse(200, buyer);
            }

            // --- SMEs ---
            if (path == "/api/smes" && method == "GET")
            {
                var client = new AmazonDynamoDBClient();
                var table = Environment.GetEnvironmentVariable("SME_TABLE_NAME") ?? "absaflow-smes";
                var scanRes = await client.ScanAsync(new ScanRequest { TableName = table });
                var smes = scanRes.Items.Select(DeserializeSme).ToList();
                return CreateResponse(200, new { smes, count = smes.Count });
            }

            if (path.StartsWith("/api/smes/") && method == "GET")
            {
                var smeId = path.Split('/').Last();
                var sme = await _dynamoService.GetSMEAsync(smeId);
                if (sme == null)
                    return CreateResponse(404, new { error = "SME not found" });
                return CreateResponse(200, sme);
            }

            return CreateResponse(404, new { error = "Not found", method, path });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return CreateResponse(500, new { error = ex.Message });
        }
    }

    // --- Deserialize helpers ---

    private static string S(Dictionary<string, AttributeValue> item, string key, string def = "")
        => item.TryGetValue(key, out var v) && v.S != null ? v.S : def;

    private static decimal N(Dictionary<string, AttributeValue> item, string key, decimal def = 0m)
        => item.TryGetValue(key, out var v) && decimal.TryParse(v.N, out var d) ? d : def;

    private static int I(Dictionary<string, AttributeValue> item, string key, int def = 0)
        => item.TryGetValue(key, out var v) && int.TryParse(v.N, out var i) ? i : def;

    private static bool B(Dictionary<string, AttributeValue> item, string key, bool def = false)
        => item.TryGetValue(key, out var v) && v.BOOL;

    private Models.Invoice DeserializeInvoice(Dictionary<string, AttributeValue> i)
    {
        return new Models.Invoice
        {
            InvoiceId = S(i, "InvoiceId", Guid.NewGuid().ToString()),
            InvoiceNumber = S(i, "InvoiceNumber"),
            SmeId = S(i, "SmeId"),
            BuyerId = S(i, "BuyerId"),
            Amount = N(i, "Amount"),
            Currency = S(i, "Currency", "ZAR"),
            IssueDate = DateTime.TryParse(i.ContainsKey("IssueDate") ? i["IssueDate"].S : "", out var id) ? id : DateTime.MinValue,
            DueDate = DateTime.TryParse(i.ContainsKey("DueDate") ? i["DueDate"].S : "", out var dd) ? dd : DateTime.MinValue,
            Status = Enum.TryParse<Models.InvoiceStatus>(S(i, "Status", "Pending"), out var st) ? st : Models.InvoiceStatus.Pending,
            ExtractedData = i.ContainsKey("ExtractedData") && !string.IsNullOrEmpty(i["ExtractedData"].S)
                ? JsonSerializer.Deserialize<Models.ExtractedData>(i["ExtractedData"].S)
                : null,
            FundingDecision = i.ContainsKey("FundingDecision") && !string.IsNullOrEmpty(i["FundingDecision"].S)
                ? JsonSerializer.Deserialize<Models.FundingDecision>(i["FundingDecision"].S)
                : null,
            Disbursement = i.ContainsKey("Disbursement") && !string.IsNullOrEmpty(i["Disbursement"].S)
                ? JsonSerializer.Deserialize<Models.Disbursement>(i["Disbursement"].S)
                : null,
        };
    }

    private Models.Buyer DeserializeBuyer(Dictionary<string, AttributeValue> i)
    {
        return new Models.Buyer
        {
            BuyerId = S(i, "BuyerId"),
            CompanyName = S(i, "CompanyName"),
            RegistrationNumber = S(i, "RegistrationNumber"),
            Industry = S(i, "Industry"),
            ContactEmail = S(i, "ContactEmail"),
            ContactPhone = S(i, "ContactPhone"),
            Address = S(i, "Address"),
            CreditRating = Enum.TryParse<Models.CreditRating>(S(i, "CreditRating", "Standard"), out var cr) ? cr : Models.CreditRating.Standard,
            IsActive = B(i, "IsActive"),
            PaymentHistory = i.ContainsKey("PaymentHistory") && !string.IsNullOrEmpty(i["PaymentHistory"].S)
                ? JsonSerializer.Deserialize<Models.PaymentHistory>(i["PaymentHistory"].S) ?? new Models.PaymentHistory()
                : new Models.PaymentHistory()
        };
    }

    private Models.SME DeserializeSme(Dictionary<string, AttributeValue> i)
    {
        return new Models.SME
        {
            SmeId = S(i, "SmeId"),
            CompanyName = S(i, "CompanyName"),
            RegistrationNumber = S(i, "RegistrationNumber"),
            Industry = S(i, "Industry"),
            YearsInOperation = I(i, "YearsInOperation"),
            AnnualRevenue = N(i, "AnnualRevenue"),
            ContactEmail = S(i, "ContactEmail"),
            ContactPhone = S(i, "ContactPhone"),
            Address = S(i, "Address"),
            BankAccountNumber = S(i, "BankAccountNumber"),
            IsVerified = B(i, "IsVerified"),
            VerificationDate = DateTime.TryParse(i.ContainsKey("VerificationDate") ? i["VerificationDate"].S : "", out var vd) ? (DateTime?)vd : null
        };
    }

    private APIGatewayProxyResponse CreateResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" }
            },
            Body = JsonSerializer.Serialize(body, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
        };
    }
}
