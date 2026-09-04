using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.S3;
using Amazon.S3.Model;
using InvoiceProcessing.Models;
using InvoiceProcessing.Services;
using System.Security.Cryptography;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace InvoiceProcessing.Functions;

public class UploadFunction
{
    private readonly IAmazonS3 _s3Client;
    private readonly ICacheService _cacheService;
    private readonly ITextractService _textractService;
    private readonly IDynamoService _dynamoService;
    private readonly string _bucketName;

    public UploadFunction()
    {
        _s3Client = new AmazonS3Client();
        _cacheService = new CacheService();
        _textractService = new TextractService();
        _dynamoService = new DynamoService();
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "invoice-uploads";
    }

    public UploadFunction(
        IAmazonS3 s3Client,
        ICacheService cacheService,
        ITextractService textractService,
        IDynamoService dynamoService)
    {
        _s3Client = s3Client;
        _cacheService = cacheService;
        _textractService = textractService;
        _dynamoService = dynamoService;
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "invoice-uploads";
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Processing invoice upload...");

            var uploadRequest = ParseUploadRequest(request);
            if (uploadRequest == null)
            {
                return CreateResponse(400, "Invalid upload request");
            }

            var documentHash = ComputeHash(uploadRequest.FileContent);

            context.Logger.LogInformation($"Checking cache for hash: {documentHash}");
            var cachedResult = await _cacheService.GetByHashAsync(documentHash);

            if (cachedResult != null)
            {
                context.Logger.LogInformation("Cache HIT - returning cached extraction");
                cachedResult.HitCount++;
                await _cacheService.UpdateAsync(cachedResult);

                return CreateResponse(200, JsonSerializer.Serialize(new
                {
                    status = "cache_hit",
                    extraction = cachedResult.ExtractionResult,
                    cacheKey = cachedResult.CacheKey
                }));
            }

            context.Logger.LogInformation("Cache MISS - uploading to S3 and calling Textract");

            var s3Key = $"invoices/{uploadRequest.SmeId}/{DateTime.UtcNow:yyyyMMdd}/{uploadRequest.FileName}";
            await UploadToS3(s3Key, uploadRequest.FileContent, uploadRequest.ContentType);

            var extractedData = await _textractService.AnalyzeDocumentAsync(s3Key);

            var cacheEntry = new ExtractionCache
            {
                CacheKey = Guid.NewGuid().ToString(),
                DocumentHash = documentHash,
                S3Key = s3Key,
                ExtractionResult = extractedData,
                HitCount = 0
            };
            await _cacheService.SaveAsync(cacheEntry);

            var invoice = new Invoice
            {
                SmeId = uploadRequest.SmeId,
                BuyerId = uploadRequest.BuyerId,
                S3Key = s3Key,
                DocumentHash = documentHash,
                Status = InvoiceStatus.Extracted,
                ExtractedData = extractedData
            };
            await _dynamoService.SaveInvoiceAsync(invoice);

            return CreateResponse(200, JsonSerializer.Serialize(new
            {
                status = "extracted",
                invoiceId = invoice.InvoiceId,
                extraction = extractedData
            }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error processing upload: {ex.Message}");
            return CreateResponse(500, $"Error processing upload: {ex.Message}");
        }
    }

    private async Task UploadToS3(string key, byte[] content, string contentType)
    {
        using var stream = new MemoryStream(content);
        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType
        };
        await _s3Client.PutObjectAsync(request);
    }

    private string ComputeHash(byte[] content)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(content);
        return Convert.ToBase64String(hash);
    }

    private UploadRequest? ParseUploadRequest(APIGatewayProxyRequest request)
    {
        if (string.IsNullOrEmpty(request.Body))
            return null;

        return JsonSerializer.Deserialize<UploadRequest>(request.Body);
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

public class UploadRequest
{
    public string SmeId { get; set; } = string.Empty;
    public string BuyerId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public string FileBase64 { get; set; } = string.Empty;
    public byte[] FileContent => Convert.FromBase64String(FileBase64);
}
