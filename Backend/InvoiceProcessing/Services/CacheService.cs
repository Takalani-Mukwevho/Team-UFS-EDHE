using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using InvoiceProcessing.Models;
using System.Text.Json;

namespace InvoiceProcessing.Services;

public class CacheService : ICacheService
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private readonly string _tableName;

    public CacheService()
    {
        _dynamoClient = new AmazonDynamoDBClient();
        _tableName = Environment.GetEnvironmentVariable("CACHE_TABLE_NAME") ?? "ExtractionCache";
    }

    public CacheService(IAmazonDynamoDB dynamoClient)
    {
        _dynamoClient = dynamoClient;
        _tableName = Environment.GetEnvironmentVariable("CACHE_TABLE_NAME") ?? "ExtractionCache";
    }

    public async Task<ExtractionCache?> GetByHashAsync(string documentHash)
    {
        var request = new QueryRequest
        {
            TableName = _tableName,
            IndexName = "DocumentHash-index",
            KeyConditionExpression = "DocumentHash = :hash",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":hash", new AttributeValue { S = documentHash } }
            }
        };

        var response = await _dynamoClient.QueryAsync(request);
        if (response.Items.Count == 0)
            return null;

        return DeserializeCacheEntry(response.Items[0]);
    }

    public async Task<ExtractionCache?> GetByKeyAsync(string cacheKey)
    {
        var request = new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                { "CacheKey", new AttributeValue { S = cacheKey } }
            }
        };

        var response = await _dynamoClient.GetItemAsync(request);
        if (response.Item.Count == 0)
            return null;

        return DeserializeCacheEntry(response.Item);
    }

    public async Task SaveAsync(ExtractionCache cacheEntry)
    {
        var item = SerializeCacheEntry(cacheEntry);
        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = item
        };

        await _dynamoClient.PutItemAsync(request);
    }

    public async Task UpdateAsync(ExtractionCache cacheEntry)
    {
        var request = new UpdateItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                { "CacheKey", new AttributeValue { S = cacheEntry.CacheKey } }
            },
            UpdateExpression = "SET HitCount = :hits, ExpiresAt = :expires",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":hits", new AttributeValue { N = cacheEntry.HitCount.ToString() } },
                { ":expires", new AttributeValue { S = cacheEntry.ExpiresAt.ToString("O") } }
            }
        };

        await _dynamoClient.UpdateItemAsync(request);
    }

    public async Task DeleteAsync(string cacheKey)
    {
        var request = new DeleteItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                { "CacheKey", new AttributeValue { S = cacheKey } }
            }
        };

        await _dynamoClient.DeleteItemAsync(request);
    }

    private Dictionary<string, AttributeValue> SerializeCacheEntry(ExtractionCache entry)
    {
        return new Dictionary<string, AttributeValue>
        {
            { "CacheKey", new AttributeValue { S = entry.CacheKey } },
            { "DocumentHash", new AttributeValue { S = entry.DocumentHash } },
            { "S3Key", new AttributeValue { S = entry.S3Key } },
            { "ExtractionResult", new AttributeValue { S = JsonSerializer.Serialize(entry.ExtractionResult) } },
            { "CreatedAt", new AttributeValue { S = entry.CreatedAt.ToString("O") } },
            { "ExpiresAt", new AttributeValue { S = entry.ExpiresAt.ToString("O") } },
            { "HitCount", new AttributeValue { N = entry.HitCount.ToString() } }
        };
    }

    private ExtractionCache DeserializeCacheEntry(Dictionary<string, AttributeValue> item)
    {
        return new ExtractionCache
        {
            CacheKey = item["CacheKey"].S,
            DocumentHash = item["DocumentHash"].S,
            S3Key = item["S3Key"].S,
            ExtractionResult = JsonSerializer.Deserialize<ExtractedData>(item["ExtractionResult"].S) ?? new ExtractedData(),
            CreatedAt = DateTime.Parse(item["CreatedAt"].S),
            ExpiresAt = DateTime.Parse(item["ExpiresAt"].S),
            HitCount = int.Parse(item["HitCount"].N)
        };
    }
}
