using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using System.Text.Json;

namespace InvoiceProcessing.Functions;

public class NotifyFunction
{
    private readonly IAmazonSimpleNotificationService _snsClient;
    private readonly string _topicArn;

    public NotifyFunction()
    {
        _snsClient = new AmazonSimpleNotificationServiceClient();
        _topicArn = Environment.GetEnvironmentVariable("SNS_TOPIC_ARN") ?? "";
    }

    public NotifyFunction(IAmazonSimpleNotificationService snsClient)
    {
        _snsClient = snsClient;
        _topicArn = Environment.GetEnvironmentVariable("SNS_TOPIC_ARN") ?? "";
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Body))
                return CreateResponse(400, new { error = "Missing request body" });

            var body = JsonSerializer.Deserialize<NotifyRequest>(request.Body);
            if (body == null || string.IsNullOrEmpty(body.Subject) || string.IsNullOrEmpty(body.Message))
                return CreateResponse(400, new { error = "Subject and Message are required" });

            context.Logger.LogInformation($"Sending email: {body.Subject}");

            var publishRequest = new PublishRequest
            {
                TopicArn = _topicArn,
                Subject = body.Subject,
                Message = body.Message,
                MessageAttributes = new Dictionary<string, MessageAttributeValue>
                {
                    {
                        "eventType",
                        new MessageAttributeValue
                        {
                            DataType = "String",
                            StringValue = body.EventType ?? "notification"
                        }
                    },
                    {
                        "recipient",
                        new MessageAttributeValue
                        {
                            DataType = "String",
                            StringValue = body.Recipient ?? "mihlalidataweb@gmail.com"
                        }
                    }
                }
            };

            var response = await _snsClient.PublishAsync(publishRequest);

            return CreateResponse(200, new
            {
                status = "sent",
                messageId = response.MessageId,
                subject = body.Subject
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return CreateResponse(500, new { error = ex.Message });
        }
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

public class NotifyRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("subject")]
    public string Subject { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("eventType")]
    public string? EventType { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("recipient")]
    public string? Recipient { get; set; }
}
