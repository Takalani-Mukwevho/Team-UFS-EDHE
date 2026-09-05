using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using InvoiceProcessing.Services;
using System.Text;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class AiExtractFunction
{
    private readonly IAmazonBedrockRuntime _bedrockClient;
    private readonly ITextractService _textractService;
    private readonly string _modelId;

    public AiExtractFunction()
    {
        _bedrockClient = new AmazonBedrockRuntimeClient(Amazon.RegionEndpoint.AFSouth1);
        _textractService = new TextractService();
        _modelId = Environment.GetEnvironmentVariable("BEDROCK_EXTRACTION_MODEL")
            ?? "global.anthropic.claude-haiku-4-5-20251001-v1:0";
    }

    public AiExtractFunction(IAmazonBedrockRuntime bedrockClient, ITextractService textractService)
    {
        _bedrockClient = bedrockClient;
        _textractService = textractService;
        _modelId = Environment.GetEnvironmentVariable("BEDROCK_EXTRACTION_MODEL")
            ?? "global.anthropic.claude-haiku-4-5-20251001-v1:0";
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("[Bedrock AI] Starting intelligent invoice extraction...");

            var body = JsonSerializer.Deserialize<ExtractRequest>(request.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (body == null || string.IsNullOrEmpty(body.RawText))
                return CreateResponse(400, new { error = "Missing rawText in request body" });

            try
            {
                context.Logger.LogInformation($"[Bedrock AI] Calling {_modelId} for extraction...");
                var aiResult = await ExtractWithBedrock(body.RawText, body.FileName, context);
                context.Logger.LogInformation($"[Bedrock AI] Extraction complete. Invoice: {aiResult.InvoiceNumber}, Amount: {aiResult.TotalAmount}");

                return CreateResponse(200, new
                {
                    source = "bedrock",
                    model = _modelId,
                    invoiceNumber = aiResult.InvoiceNumber,
                    vendorName = aiResult.VendorName,
                    vendorAddress = aiResult.VendorAddress,
                    buyerName = aiResult.BuyerName,
                    buyerAddress = aiResult.BuyerAddress,
                    totalAmount = aiResult.TotalAmount,
                    subtotal = aiResult.Subtotal,
                    taxAmount = aiResult.TaxAmount,
                    issueDate = aiResult.IssueDate,
                    dueDate = aiResult.DueDate,
                    termsDays = aiResult.TermsDays,
                    poRef = aiResult.PoRef,
                    lineItems = aiResult.LineItems,
                    confidence = aiResult.ConfidenceScores,
                    extractionNotes = aiResult.ExtractionNotes,
                });
            }
            catch (Exception ex)
            {
                context.Logger.LogWarning($"[Bedrock AI] Bedrock extraction failed: {ex.Message}. Falling back...");
                var fallbackResult = await _textractService.AnalyzeDocumentAsync(
                    Encoding.UTF8.GetBytes(body.RawText), "text/plain");
                return CreateResponse(200, new
                {
                    source = "fallback",
                    model = "textract-native",
                    invoiceNumber = fallbackResult.InvoiceNumber,
                    vendorName = fallbackResult.VendorName,
                    buyerName = fallbackResult.BuyerName,
                    totalAmount = fallbackResult.TotalAmount,
                    subtotal = fallbackResult.Subtotal,
                    taxAmount = fallbackResult.TaxAmount,
                    lineItems = fallbackResult.LineItems,
                    confidence = new Dictionary<string, double>(),
                    extractionNotes = "Fallback extraction - Bedrock unavailable",
                });
            }
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"[Bedrock AI] Fatal error: {ex.Message}");
            return CreateResponse(500, new { error = $"AI extraction failed: {ex.Message}" });
        }
    }

    private async Task<ExtractionResult> ExtractWithBedrock(string rawText, string fileName, ILambdaContext context)
    {
        var prompt = BuildExtractionPrompt(rawText, fileName);

        // Messages API format for Bedrock
        var bodyJson = JsonSerializer.Serialize(new
        {
            anthropic_version = "bedrock-2023-05-31",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 2048,
            temperature = 0.0,
            system = "You are an expert invoice data extraction AI. Extract ALL fields with high precision. Return ONLY valid JSON, no markdown, no explanation."
        });
        var bodyStream = new MemoryStream(Encoding.UTF8.GetBytes(bodyJson));

        var request = new InvokeModelRequest
        {
            ModelId = _modelId,
            ContentType = "application/json",
            Accept = "application/json",
            Body = bodyStream
        };

        context.Logger.LogInformation($"[Bedrock AI] Invoking {_modelId}...");
        var response = await _bedrockClient.InvokeModelAsync(request);
        using var reader = new StreamReader(response.Body);
        var responseBody = await reader.ReadToEndAsync();
        context.Logger.LogInformation($"[Bedrock AI] Received {responseBody.Length} chars from Claude");

        // Parse Messages API response: content[0].text
        var doc = JsonDocument.Parse(responseBody);
        string responseText = "";
        if (doc.RootElement.TryGetProperty("content", out var contentProp)
            && contentProp.ValueKind == JsonValueKind.Array
            && contentProp.GetArrayLength() > 0)
            responseText = contentProp[0].GetProperty("text").GetString() ?? "";
        else if (doc.RootElement.TryGetProperty("completion", out var compProp))
            responseText = compProp.GetString() ?? "";

        return ParseExtractionResponse(responseText);
    }

    private string BuildExtractionPrompt(string rawText, string fileName)
    {
        var truncatedText = rawText.Length > 6000
            ? rawText.Substring(0, 6000) + "\n... [truncated]"
            : rawText;

        return $"Extract ALL invoice data from this document text.\n\nDocument filename: {fileName}\n\nRaw document text:\n---\n{truncatedText}\n---\n\nReturn a JSON object with exactly these fields:\n{{\n  \"invoiceNumber\": \"string\",\n  \"issueDate\": \"DD/MM/YYYY or null\",\n  \"dueDate\": \"DD/MM/YYYY or null\",\n  \"termsDays\": number_or_null,\n  \"poRef\": \"string or null\",\n  \"vendorName\": \"string\",\n  \"vendorAddress\": \"string or null\",\n  \"buyerName\": \"string\",\n  \"buyerAddress\": \"string or null\",\n  \"lineItems\": [{{\"description\":\"string\",\"quantity\":number,\"unitPrice\":number,\"amount\":number}}],\n  \"subtotal\": number,\n  \"taxAmount\": number,\n  \"totalAmount\": number,\n  \"currency\": \"ZAR\",\n  \"confidence\": {{\"invoiceNumber\":0-100,\"vendorName\":0-100,\"buyerName\":0-100,\"amount\":0-100,\"dates\":0-100,\"lineItems\":0-100}},\n  \"extractionNotes\": \"string\"\n}}\n\nRules: Extract EXACTLY what you see. Do NOT invent data. If a field is missing, use null and set confidence to 0. Amounts must be numeric. Return ONLY the JSON.";
    }

    private ExtractionResult ParseExtractionResponse(string responseText)
    {
        var cleaned = responseText.Trim();
        if (cleaned.StartsWith("```"))
            cleaned = cleaned.Substring(cleaned.IndexOf('\n') + 1);
        if (cleaned.EndsWith("```"))
            cleaned = cleaned.Substring(0, cleaned.LastIndexOf("```"));
        cleaned = cleaned.Trim();

        try
        {
            var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            var result = new ExtractionResult
            {
                InvoiceNumber = GetStr(root, "invoiceNumber"),
                VendorName = GetStr(root, "vendorName"),
                VendorAddress = GetStrOrNull(root, "vendorAddress"),
                BuyerName = GetStr(root, "buyerName"),
                BuyerAddress = GetStrOrNull(root, "buyerAddress"),
                IssueDate = GetStrOrNull(root, "issueDate"),
                DueDate = GetStrOrNull(root, "dueDate"),
                PoRef = GetStrOrNull(root, "poRef"),
                ExtractionNotes = GetStrOrNull(root, "extractionNotes"),
            };
            if (root.TryGetProperty("totalAmount", out var a) && a.TryGetDouble(out var av)) result.TotalAmount = (decimal)av;
            if (root.TryGetProperty("subtotal", out var s) && s.TryGetDouble(out var sv)) result.Subtotal = (decimal)sv;
            if (root.TryGetProperty("taxAmount", out var t) && t.TryGetDouble(out var tv)) result.TaxAmount = (decimal)tv;
            if (root.TryGetProperty("termsDays", out var td) && td.TryGetInt32(out var tdv)) result.TermsDays = tdv;
            if (root.TryGetProperty("confidence", out var c) && c.ValueKind == JsonValueKind.Object)
            {
                result.ConfidenceScores = new Dictionary<string, double>();
                foreach (var p in c.EnumerateObject())
                    if (p.Value.TryGetDouble(out var score)) result.ConfidenceScores[p.Name] = score;
            }
            if (root.TryGetProperty("lineItems", out var li) && li.ValueKind == JsonValueKind.Array)
            {
                result.LineItems = new List<Models.LineItem>();
                foreach (var item in li.EnumerateArray())
                {
                    var lineItem = new Models.LineItem { Description = GetStr(item, "description") };
                    if (item.TryGetProperty("quantity", out var q) && q.TryGetDouble(out var qv)) lineItem.Quantity = (decimal)qv;
                    if (item.TryGetProperty("unitPrice", out var up) && up.TryGetDouble(out var upv)) lineItem.UnitPrice = (decimal)upv;
                    if (item.TryGetProperty("amount", out var am) && am.TryGetDouble(out var amv)) lineItem.Amount = (decimal)amv;
                    result.LineItems.Add(lineItem);
                }
            }
            return result;
        }
        catch (Exception ex)
        {
            return new ExtractionResult { ExtractionNotes = $"Parse failed: {ex.Message}. Raw: {responseText.Substring(0, Math.Min(500, responseText.Length))}" };
        }
    }

    private static string GetStr(JsonElement e, string p) =>
        e.TryGetProperty(p, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : "";
    private static string? GetStrOrNull(JsonElement e, string p) =>
        e.TryGetProperty(p, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private APIGatewayProxyResponse CreateResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" },
                { "Access-Control-Allow-Methods", "POST, OPTIONS" },
                { "Access-Control-Allow-Headers", "*" }
            },
            Body = JsonSerializer.Serialize(body, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
        };
    }
}

public class ExtractRequest
{
    public string RawText { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class ExtractionResult
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string VendorName { get; set; } = string.Empty;
    public string? VendorAddress { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerAddress { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public string? IssueDate { get; set; }
    public string? DueDate { get; set; }
    public int TermsDays { get; set; } = 60;
    public string? PoRef { get; set; }
    public List<Models.LineItem> LineItems { get; set; } = new();
    public Dictionary<string, double> ConfidenceScores { get; set; } = new();
    public string? ExtractionNotes { get; set; }
}
