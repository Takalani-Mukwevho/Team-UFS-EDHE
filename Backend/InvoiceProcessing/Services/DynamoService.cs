using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using InvoiceProcessing.Models;
using System.Text.Json;

namespace InvoiceProcessing.Services;

public class DynamoService : IDynamoService
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private readonly string _invoiceTable;
    private readonly string _buyerTable;
    private readonly string _smeTable;

    public DynamoService()
    {
        _dynamoClient = new AmazonDynamoDBClient();
        _invoiceTable = Environment.GetEnvironmentVariable("INVOICE_TABLE_NAME") ?? "Invoices";
        _buyerTable = Environment.GetEnvironmentVariable("BUYER_TABLE_NAME") ?? "Buyers";
        _smeTable = Environment.GetEnvironmentVariable("SME_TABLE_NAME") ?? "SMEs";
    }

    public DynamoService(IAmazonDynamoDB dynamoClient)
    {
        _dynamoClient = dynamoClient;
        _invoiceTable = Environment.GetEnvironmentVariable("INVOICE_TABLE_NAME") ?? "Invoices";
        _buyerTable = Environment.GetEnvironmentVariable("BUYER_TABLE_NAME") ?? "Buyers";
        _smeTable = Environment.GetEnvironmentVariable("SME_TABLE_NAME") ?? "SMEs";
    }

    public async Task SaveInvoiceAsync(Invoice invoice)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            { "InvoiceId", new AttributeValue { S = invoice.InvoiceId } },
            { "SmeId", new AttributeValue { S = invoice.SmeId } },
            { "BuyerId", new AttributeValue { S = invoice.BuyerId } },
            { "InvoiceNumber", new AttributeValue { S = invoice.InvoiceNumber } },
            { "Amount", new AttributeValue { N = invoice.Amount.ToString() } },
            { "Currency", new AttributeValue { S = invoice.Currency } },
            { "IssueDate", new AttributeValue { S = invoice.IssueDate.ToString("O") } },
            { "DueDate", new AttributeValue { S = invoice.DueDate.ToString("O") } },
            { "Status", new AttributeValue { S = invoice.Status.ToString() } },
            { "S3Key", new AttributeValue { S = invoice.S3Key } },
            { "DocumentHash", new AttributeValue { S = invoice.DocumentHash } },
            { "CreatedAt", new AttributeValue { S = invoice.CreatedAt.ToString("O") } },
            { "UpdatedAt", new AttributeValue { S = invoice.UpdatedAt.ToString("O") } }
        };

        if (invoice.ExtractedData != null)
        {
            item["ExtractedData"] = new AttributeValue { S = JsonSerializer.Serialize(invoice.ExtractedData) };
        }

        if (invoice.FundingDecision != null)
        {
            item["FundingDecision"] = new AttributeValue { S = JsonSerializer.Serialize(invoice.FundingDecision) };
        }

        var request = new PutItemRequest
        {
            TableName = _invoiceTable,
            Item = item
        };

        await _dynamoClient.PutItemAsync(request);
    }

    public async Task<Invoice?> GetInvoiceAsync(string invoiceId)
    {
        var request = new GetItemRequest
        {
            TableName = _invoiceTable,
            Key = new Dictionary<string, AttributeValue>
            {
                { "InvoiceId", new AttributeValue { S = invoiceId } }
            }
        };

        var response = await _dynamoClient.GetItemAsync(request);
        if (response.Item.Count == 0)
            return null;

        return DeserializeInvoice(response.Item);
    }

    public async Task<List<Invoice>> GetInvoicesBySmeAsync(string smeId)
    {
        var request = new QueryRequest
        {
            TableName = _invoiceTable,
            IndexName = "SmeId-index",
            KeyConditionExpression = "SmeId = :smeId",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":smeId", new AttributeValue { S = smeId } }
            }
        };

        var response = await _dynamoClient.QueryAsync(request);
        return response.Items.Select(DeserializeInvoice).ToList();
    }

    public async Task<List<Invoice>> GetInvoicesByBuyerAsync(string buyerId)
    {
        var request = new QueryRequest
        {
            TableName = _invoiceTable,
            IndexName = "BuyerId-index",
            KeyConditionExpression = "BuyerId = :buyerId",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":buyerId", new AttributeValue { S = buyerId } }
            }
        };

        var response = await _dynamoClient.QueryAsync(request);
        return response.Items.Select(DeserializeInvoice).ToList();
    }

    public async Task SaveBuyerAsync(Buyer buyer)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            { "BuyerId", new AttributeValue { S = buyer.BuyerId } },
            { "CompanyName", new AttributeValue { S = buyer.CompanyName } },
            { "RegistrationNumber", new AttributeValue { S = buyer.RegistrationNumber } },
            { "Industry", new AttributeValue { S = buyer.Industry } },
            { "ContactEmail", new AttributeValue { S = buyer.ContactEmail } },
            { "ContactPhone", new AttributeValue { S = buyer.ContactPhone } },
            { "Address", new AttributeValue { S = buyer.Address } },
            { "CreditRating", new AttributeValue { S = buyer.CreditRating.ToString() } },
            { "IsActive", new AttributeValue { BOOL = buyer.IsActive } },
            { "CreatedAt", new AttributeValue { S = buyer.CreatedAt.ToString("O") } },
            { "PaymentHistory", new AttributeValue { S = JsonSerializer.Serialize(buyer.PaymentHistory) } }
        };

        var request = new PutItemRequest
        {
            TableName = _buyerTable,
            Item = item
        };

        await _dynamoClient.PutItemAsync(request);
    }

    public async Task<Buyer?> GetBuyerAsync(string buyerId)
    {
        var request = new GetItemRequest
        {
            TableName = _buyerTable,
            Key = new Dictionary<string, AttributeValue>
            {
                { "BuyerId", new AttributeValue { S = buyerId } }
            }
        };

        var response = await _dynamoClient.GetItemAsync(request);
        if (response.Item.Count == 0)
            return null;

        return DeserializeBuyer(response.Item);
    }

    public async Task SaveSMEAsync(SME sme)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            { "SmeId", new AttributeValue { S = sme.SmeId } },
            { "CompanyName", new AttributeValue { S = sme.CompanyName } },
            { "RegistrationNumber", new AttributeValue { S = sme.RegistrationNumber } },
            { "Industry", new AttributeValue { S = sme.Industry } },
            { "YearsInOperation", new AttributeValue { N = sme.YearsInOperation.ToString() } },
            { "AnnualRevenue", new AttributeValue { N = sme.AnnualRevenue.ToString() } },
            { "ContactEmail", new AttributeValue { S = sme.ContactEmail } },
            { "ContactPhone", new AttributeValue { S = sme.ContactPhone } },
            { "Address", new AttributeValue { S = sme.Address } },
            { "BankAccountNumber", new AttributeValue { S = sme.BankAccountNumber } },
            { "IsVerified", new AttributeValue { BOOL = sme.IsVerified } },
            { "CreatedAt", new AttributeValue { S = sme.CreatedAt.ToString("O") } }
        };

        if (sme.VerificationDate.HasValue)
        {
            item["VerificationDate"] = new AttributeValue { S = sme.VerificationDate.Value.ToString("O") };
        }

        var request = new PutItemRequest
        {
            TableName = _smeTable,
            Item = item
        };

        await _dynamoClient.PutItemAsync(request);
    }

    public async Task<SME?> GetSMEAsync(string smeId)
    {
        var request = new GetItemRequest
        {
            TableName = _smeTable,
            Key = new Dictionary<string, AttributeValue>
            {
                { "SmeId", new AttributeValue { S = smeId } }
            }
        };

        var response = await _dynamoClient.GetItemAsync(request);
        if (response.Item.Count == 0)
            return null;

        return DeserializeSME(response.Item);
    }

    private Invoice DeserializeInvoice(Dictionary<string, AttributeValue> item)
    {
        return new Invoice
        {
            InvoiceId = item["InvoiceId"].S,
            SmeId = item["SmeId"].S,
            BuyerId = item["BuyerId"].S,
            InvoiceNumber = item["InvoiceNumber"].S,
            Amount = decimal.Parse(item["Amount"].N),
            Currency = item["Currency"].S,
            IssueDate = DateTime.Parse(item["IssueDate"].S),
            DueDate = DateTime.Parse(item["DueDate"].S),
            Status = Enum.Parse<InvoiceStatus>(item["Status"].S),
            S3Key = item["S3Key"].S,
            DocumentHash = item["DocumentHash"].S,
            ExtractedData = item.ContainsKey("ExtractedData")
                ? JsonSerializer.Deserialize<ExtractedData>(item["ExtractedData"].S)
                : null,
            FundingDecision = item.ContainsKey("FundingDecision")
                ? JsonSerializer.Deserialize<FundingDecision>(item["FundingDecision"].S)
                : null,
            CreatedAt = DateTime.Parse(item["CreatedAt"].S),
            UpdatedAt = DateTime.Parse(item["UpdatedAt"].S)
        };
    }

    private Buyer DeserializeBuyer(Dictionary<string, AttributeValue> item)
    {
        return new Buyer
        {
            BuyerId = item["BuyerId"].S,
            CompanyName = item["CompanyName"].S,
            RegistrationNumber = item["RegistrationNumber"].S,
            Industry = item["Industry"].S,
            ContactEmail = item["ContactEmail"].S,
            ContactPhone = item["ContactPhone"].S,
            Address = item["Address"].S,
            CreditRating = Enum.Parse<CreditRating>(item["CreditRating"].S),
            IsActive = item["IsActive"].BOOL,
            CreatedAt = DateTime.Parse(item["CreatedAt"].S),
            PaymentHistory = item.ContainsKey("PaymentHistory")
                ? JsonSerializer.Deserialize<PaymentHistory>(item["PaymentHistory"].S) ?? new PaymentHistory()
                : new PaymentHistory()
        };
    }

    private SME DeserializeSME(Dictionary<string, AttributeValue> item)
    {
        return new SME
        {
            SmeId = item["SmeId"].S,
            CompanyName = item["CompanyName"].S,
            RegistrationNumber = item["RegistrationNumber"].S,
            Industry = item["Industry"].S,
            YearsInOperation = int.Parse(item["YearsInOperation"].N),
            AnnualRevenue = decimal.Parse(item["AnnualRevenue"].N),
            ContactEmail = item["ContactEmail"].S,
            ContactPhone = item["ContactPhone"].S,
            Address = item["Address"].S,
            BankAccountNumber = item["BankAccountNumber"].S,
            IsVerified = item["IsVerified"].BOOL,
            VerificationDate = item.ContainsKey("VerificationDate")
                ? DateTime.Parse(item["VerificationDate"].S)
                : null,
            CreatedAt = DateTime.Parse(item["CreatedAt"].S)
        };
    }
}
