using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class AiNarrativeFunction
{
    private readonly IAmazonBedrockRuntime _bedrockClient;
    private readonly string _modelId;

    // In-memory cache — survives across warm Lambda invocations
    private static readonly ConcurrentDictionary<string, (string data, DateTime expiry)> _cache = new();
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

    public AiNarrativeFunction()
    {
        _bedrockClient = new AmazonBedrockRuntimeClient(Amazon.RegionEndpoint.AFSouth1);
        _modelId = Environment.GetEnvironmentVariable("BEDROCK_NARRATIVE_MODEL")
            ?? "global.anthropic.claude-haiku-4-5-20251001-v1:0";
    }

    public AiNarrativeFunction(IAmazonBedrockRuntime bedrockClient)
    {
        _bedrockClient = bedrockClient;
        _modelId = Environment.GetEnvironmentVariable("BEDROCK_NARRATIVE_MODEL")
            ?? "global.anthropic.claude-haiku-4-5-20251001-v1:0";
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("[Bedrock AI] Generating risk narrative...");

            var body = JsonSerializer.Deserialize<NarrativeRequest>(request.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (body == null)
                return CreateResponse(400, new { error = "Missing request body" });

            // Check cache
            var cacheKey = $"{body.InvoiceNumber}|{body.RiskBand}|{body.BuyerOnTimeRate}";
            if (_cache.TryGetValue(cacheKey, out var cached) && DateTime.UtcNow < cached.expiry)
            {
                context.Logger.LogInformation("[Bedrock AI] Cache HIT — returning cached narrative");
                return CreateResponse(200, JsonSerializer.Deserialize<object>(cached.data)!);
            }

            try
            {
                var prompt = BuildNarrativePrompt(body);
                var bodyJson = JsonSerializer.Serialize(new
                {
                    anthropic_version = "bedrock-2023-05-31",
                    messages = new[] { new { role = "user", content = prompt } },
                    max_tokens = 1024,
                    temperature = 0.3,
                    system = "You are a senior credit analyst at Absa Bank. Write concise, professional risk narratives in plain language."
                });
                var bodyStream = new MemoryStream(Encoding.UTF8.GetBytes(bodyJson));

                var bedrockRequest = new InvokeModelRequest
                {
                    ModelId = _modelId,
                    ContentType = "application/json",
                    Accept = "application/json",
                    Body = bodyStream
                };

                context.Logger.LogInformation($"[Bedrock AI] Calling {_modelId}...");
                var response = await _bedrockClient.InvokeModelAsync(bedrockRequest);
                using var reader = new StreamReader(response.Body);
                var responseBody = await reader.ReadToEndAsync();

                var doc = JsonDocument.Parse(responseBody);
                string narrativeText = "";
                if (doc.RootElement.TryGetProperty("content", out var contentProp)
                    && contentProp.ValueKind == JsonValueKind.Array
                    && contentProp.GetArrayLength() > 0)
                    narrativeText = contentProp[0].GetProperty("text").GetString() ?? "";

                context.Logger.LogInformation($"[Bedrock AI] Narrative generated ({narrativeText.Length} chars)");
                var result = ParseNarrativeResponse(narrativeText);

                var responseObj = new
                {
                    source = "bedrock",
                    model = _modelId,
                    narrative = result.Narrative,
                    keyFactors = result.KeyFactors,
                    recommendation = result.Recommendation,
                };

                // Store in cache
                var json = JsonSerializer.Serialize(responseObj);
                _cache[cacheKey] = (json, DateTime.UtcNow.Add(CacheTtl));
                context.Logger.LogInformation("[Bedrock AI] Response cached for 10 minutes");

                return CreateResponse(200, responseObj);
            }
            catch (Exception ex)
            {
                context.Logger.LogWarning($"[Bedrock AI] Bedrock failed: {ex.Message}. Using fallback...");
                var fallback = GenerateFallbackNarrative(body);
                var fallbackObj = new
                {
                    source = "fallback",
                    model = "rule-based",
                    narrative = fallback.Narrative,
                    keyFactors = fallback.KeyFactors,
                    recommendation = fallback.Recommendation,
                };

                // Cache fallback too — no point retrying if Bedrock is down
                var json = JsonSerializer.Serialize(fallbackObj);
                _cache[cacheKey] = (json, DateTime.UtcNow.Add(CacheTtl));

                return CreateResponse(200, fallbackObj);
            }
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"[Bedrock AI] Fatal error: {ex.Message}");
            return CreateResponse(500, new { error = $"AI narrative failed: {ex.Message}" });
        }
    }

    private string BuildNarrativePrompt(NarrativeRequest body)
    {
        var onTimeRate = Math.Round((body.BuyerOnTimeRate ?? 0) * 100);
        var avgDays = body.BuyerAvgSettlementDays ?? 0;
        var terms = body.TermsDays ?? 60;
        var riskScore = body.RiskScore ?? 0;
        var riskBand = body.RiskBand ?? "Medium";

        var sb = new StringBuilder();
        sb.AppendLine("You are a senior credit analyst at Absa Bank's Invoice Finance division.");
        sb.AppendLine("Analyze this invoice funding case and write a concise, professional risk narrative.");
        sb.AppendLine();
        sb.AppendLine("Input data:");
        sb.AppendLine($"- Invoice: {body.InvoiceNumber} for R{body.Amount:N0}");
        sb.AppendLine($"- Supplier (SME): {body.SupplierName} ({body.SupplierIndustry}, {body.SupplierYears} years, revenue R{body.SupplierRevenue:N0})");
        sb.AppendLine($"- Buyer (Debtor): {body.BuyerName} ({body.BuyerSector})");
        sb.AppendLine($"- Payment terms: {terms} days");
        sb.AppendLine($"- Buyer on-time payment rate: {onTimeRate}%");
        sb.AppendLine($"- Buyer average settlement: {avgDays} days");
        sb.AppendLine($"- Risk score: {riskScore}/100 ({riskBand})");
        sb.AppendLine($"- Invoice verification: {body.VerificationStatus}");
        sb.AppendLine();
        sb.AppendLine("Write a 2-3 sentence narrative that:");
        sb.AppendLine("1. States whether this invoice is suitable for early funding");
        sb.AppendLine("2. Explains the key factors supporting or concerning the decision");
        sb.AppendLine("3. Uses plain language an SME owner would understand");
        sb.AppendLine();
        sb.AppendLine("Then provide:");
        sb.AppendLine("- 3 key factors (one per line, prefixed with '- ')");
        sb.AppendLine("- A one-line recommendation");
        sb.AppendLine();
        sb.AppendLine("Tone: Professional, trustworthy, clear.");
        sb.AppendLine("Do NOT use jargon. Do NOT include raw numbers in the narrative.");
        return sb.ToString();
    }

    private NarrativeResult ParseNarrativeResponse(string text)
    {
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var narrativeLines = new List<string>();
        var keyFactors = new List<string>();
        string recommendation = "";
        bool inFactors = false, inRec = false;

        foreach (var line in lines)
        {
            var t = line.Trim();
            if (t.StartsWith("- ") || t.StartsWith("* "))
            {
                inFactors = true;
                keyFactors.Add(t.Substring(2).Trim());
            }
            else if (t.ToLower().Contains("recommendation"))
            {
                inRec = true; inFactors = false;
                var r = t.Contains(":") ? t.Substring(t.IndexOf(":") + 1).Trim() : t;
                if (!string.IsNullOrWhiteSpace(r)) recommendation = r;
            }
            else if (inRec && !string.IsNullOrWhiteSpace(t))
                recommendation += " " + t;
            else if (!inFactors && !inRec && !string.IsNullOrWhiteSpace(t))
                narrativeLines.Add(t);
        }

        if (narrativeLines.Count == 0 && keyFactors.Count == 0)
            return new NarrativeResult { Narrative = text, KeyFactors = new(), Recommendation = "" };

        return new NarrativeResult
        {
            Narrative = string.Join(" ", narrativeLines),
            KeyFactors = keyFactors,
            Recommendation = recommendation.Trim(),
        };
    }

    private NarrativeResult GenerateFallbackNarrative(NarrativeRequest body)
    {
        var onTimeRate = Math.Round((body.BuyerOnTimeRate ?? 0) * 100);
        var avgDays = body.BuyerAvgSettlementDays ?? 0;
        var terms = body.TermsDays ?? 60;
        var riskBand = body.RiskBand ?? "Medium";
        string narrative;
        var keyFactors = new List<string>();
        string recommendation;

        if (riskBand == "Low")
        {
            narrative = $"{body.BuyerName} has a strong payment track record, settling {onTimeRate}% of invoices on time with an average of {avgDays} days. This invoice appears suitable for early funding with low risk.";
            keyFactors = new List<string>
            {
                $"{onTimeRate}% on-time payment rate - strong buyer reliability",
                $"Average settlement {avgDays} days vs {terms}-day terms - buyer pays early",
                $"SME {body.VerificationStatus} - verified supplier profile",
            };
            recommendation = "Approve for immediate funding at the standard advance rate.";
        }
        else if (riskBand == "Medium")
        {
            narrative = $"{body.BuyerName} shows a moderate payment pattern at {onTimeRate}% on-time, averaging {avgDays} days. Some caution is warranted - this invoice may benefit from partial funding.";
            keyFactors = new List<string>
            {
                $"{onTimeRate}% on-time payment rate - moderate buyer reliability",
                $"Settlement averages {avgDays} days against {terms}-day terms",
                $"Risk score {body.RiskScore}/100 - within acceptable range",
            };
            recommendation = "Consider partial advance with enhanced monitoring.";
        }
        else
        {
            narrative = $"{body.BuyerName} has inconsistent payment history at only {onTimeRate}% on-time. This invoice carries elevated risk and may not be suitable for early funding.";
            keyFactors = new List<string>
            {
                $"Only {onTimeRate}% on-time payment rate - elevated default risk",
                $"Settlement significantly exceeds {terms}-day terms",
                $"Risk score below funding threshold",
            };
            recommendation = "Recommend standard collection terms - no early funding.";
        }

        return new NarrativeResult { Narrative = narrative, KeyFactors = keyFactors, Recommendation = recommendation };
    }

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

public class NarrativeRequest
{
    public string InvoiceNumber { get; set; } = "";
    public decimal Amount { get; set; }
    public string SupplierName { get; set; } = "";
    public string SupplierIndustry { get; set; } = "";
    public int SupplierYears { get; set; }
    public decimal SupplierRevenue { get; set; }
    public string BuyerName { get; set; } = "";
    public string BuyerSector { get; set; } = "";
    public double? BuyerOnTimeRate { get; set; }
    public int? BuyerAvgSettlementDays { get; set; }
    public int? TermsDays { get; set; }
    public double? RiskScore { get; set; }
    public string? RiskBand { get; set; }
    public string VerificationStatus { get; set; } = "Passed";
}

public class NarrativeResult
{
    public string Narrative { get; set; } = "";
    public List<string> KeyFactors { get; set; } = new();
    public string Recommendation { get; set; } = "";
}
