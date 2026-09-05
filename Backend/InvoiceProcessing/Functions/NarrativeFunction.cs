using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class NarrativeFunction
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;

    public NarrativeFunction()
    {
        _dynamoDb = new AmazonDynamoDBClient();
        _tableName = Environment.GetEnvironmentVariable("NARRATIVE_TABLE_NAME") ?? "absaflow-narratives";
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation($"NarrativeFunction invoked: method={request.HttpMethod} path={request.Path} bodyLen={request.Body?.Length ?? 0}");

            // Detect method: V2 payload uses body presence + query params
            var hasQueryInvoiceId = request.QueryStringParameters != null
                && request.QueryStringParameters.ContainsKey("invoiceId");
            var isPost = !string.IsNullOrEmpty(request.Body) && !hasQueryInvoiceId;

            if (!isPost && hasQueryInvoiceId)
            {
                return await GetNarrative(request.QueryStringParameters!["invoiceId"]);
            }

            if (isPost && !string.IsNullOrEmpty(request.Body))
            {
                var body = JsonSerializer.Deserialize<JsonElement>(request.Body);
                var invoiceId = body.GetProperty("invoiceId").GetString();
                var narrative = body.GetProperty("narrative");
                return await SaveNarrative(invoiceId!, narrative);
            }

            return ApiResponse(400, new { error = "Use GET?invoiceId=xxx or POST with { invoiceId, narrative }" });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"NarrativeFunction error: {ex.Message}\n{ex.StackTrace}");
            return ApiResponse(500, new { error = ex.Message });
        }
    }

    private async Task<APIGatewayProxyResponse> GetNarrative(string invoiceId)
    {
        var request = new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                { "InvoiceId", new AttributeValue { S = invoiceId } }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);
        if (response.Item == null || response.Item.Count == 0)
            return ApiResponse(404, new { error = "Narrative not found", invoiceId });

        var narrativeJson = response.Item.ContainsKey("Narrative")
            ? response.Item["Narrative"].S
            : "{}";

        var result = JsonSerializer.Deserialize<JsonElement>(narrativeJson);
        return ApiResponse(200, new
        {
            invoiceId,
            narrative = result,
            cached = true
        });
    }

    private async Task<APIGatewayProxyResponse> SaveNarrative(string invoiceId, JsonElement narrative)
    {
        var narrativeJson = JsonSerializer.Serialize(narrative);

        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = new Dictionary<string, AttributeValue>
            {
                { "InvoiceId", new AttributeValue { S = invoiceId } },
                { "Narrative", new AttributeValue { S = narrativeJson } },
                { "CreatedAt", new AttributeValue { S = DateTime.UtcNow.ToString("o") } }
            }
        };

        await _dynamoDb.PutItemAsync(request);

        return ApiResponse(201, new
        {
            invoiceId,
            status = "saved",
            message = "Narrative persisted to DynamoDB"
        });
    }

    private static APIGatewayProxyResponse ApiResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" }
            },
            Body = JsonSerializer.Serialize(body)
        };
    }
}
