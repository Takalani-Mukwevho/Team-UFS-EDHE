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

    public async Task<Invoice?> GetInvoiceAsync(string invoiceIdOrNumber)
    {
        // 1. Direct lookup by Table Partition Key (InvoiceId)
        try
        {
            var request = new GetItemRequest
            {
                TableName = _invoiceTable,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "InvoiceId", new AttributeValue { S = invoiceIdOrNumber } }
                }
            };

            var response = await _dynamoClient.GetItemAsync(request);
            if (response.Item != null && response.Item.Count > 0)
                return DeserializeInvoice(response.Item);
        }
        catch
        {
            // Fall through to scan
        }

        // 2. Fallback scan if the caller passed InvoiceId (e.g. "demo-inv-001") instead of InvoiceNumber
        var scanRequest = new ScanRequest
        {
            TableName = _invoiceTable,
            FilterExpression = "InvoiceId = :val OR InvoiceNumber = :val",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":val", new AttributeValue { S = invoiceIdOrNumber } }
            }
        };

        var scanResponse = await _dynamoClient.ScanAsync(scanRequest);
        return scanResponse.Items.Select(DeserializeInvoice).FirstOrDefault();
    }

    public async Task<List<Invoice>> GetInvoicesBySmeAsync(string smeId)
    {
        var request = new ScanRequest
        {
            TableName = _invoiceTable,
            FilterExpression = "SmeId = :smeId",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":smeId", new AttributeValue { S = smeId } }
            }
        };

        var response = await _dynamoClient.ScanAsync(request);
        return response.Items.Select(DeserializeInvoice).ToList();
    }

    public async Task<List<Invoice>> GetInvoicesByBuyerAsync(string buyerId)
    {
        var request = new ScanRequest
        {
            TableName = _invoiceTable,
            FilterExpression = "BuyerId = :buyerId",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":buyerId", new AttributeValue { S = buyerId } }
            }
        };

        var response = await _dynamoClient.ScanAsync(request);
        return response.Items.Select(DeserializeInvoice).ToList();
    }    public async Task SaveBuyerAsync(Buyer buyer)
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

    private static string GetString(Dictionary<string, AttributeValue> item, string key, string defaultValue = "") =>
        item.TryGetValue(key, out var val) && val.S != null ? val.S : defaultValue;

    private static decimal GetDecimal(Dictionary<string, AttributeValue> item, string key, decimal defaultValue = 0m) =>
        item.TryGetValue(key, out var val) && decimal.TryParse(val.N, out var d) ? d : defaultValue;

    private static int GetInt(Dictionary<string, AttributeValue> item, string key, int defaultValue = 0) =>
        item.TryGetValue(key, out var val) && int.TryParse(val.N, out var i) ? i : defaultValue;

    private static bool GetBool(Dictionary<string, AttributeValue> item, string key, bool defaultValue = false) =>
        item.TryGetValue(key, out var val) && val.BOOL;

    private Invoice DeserializeInvoice(Dictionary<string, AttributeValue> item)
    {
        return new Invoice
        {
            InvoiceId = GetString(item, "InvoiceId", Guid.NewGuid().ToString()),
            SmeId = GetString(item, "SmeId"),
            BuyerId = GetString(item, "BuyerId"),
            InvoiceNumber = GetString(item, "InvoiceNumber"),
            Amount = GetDecimal(item, "Amount"),
            Currency = GetString(item, "Currency", "ZAR"),
            IssueDate = item.TryGetValue("IssueDate", out var id) && DateTime.TryParse(id.S, out var dtId) ? dtId : DateTime.UtcNow,
            DueDate = item.TryGetValue("DueDate", out var dd) && DateTime.TryParse(dd.S, out var dtDd) ? dtDd : DateTime.UtcNow.AddDays(30),
            Status = item.TryGetValue("Status", out var st) && Enum.TryParse<InvoiceStatus>(st.S, out var s) ? s : InvoiceStatus.Pending,
            S3Key = GetString(item, "S3Key"),
            DocumentHash = GetString(item, "DocumentHash"),
            ExtractedData = item.ContainsKey("ExtractedData")
                ? JsonSerializer.Deserialize<ExtractedData>(item["ExtractedData"].S)
                : null,
            FundingDecision = item.ContainsKey("FundingDecision")
                ? JsonSerializer.Deserialize<FundingDecision>(item["FundingDecision"].S)
                : null,
            CreatedAt = item.TryGetValue("CreatedAt", out var ca) && DateTime.TryParse(ca.S, out var dtCa) ? dtCa : DateTime.UtcNow,
            UpdatedAt = item.TryGetValue("UpdatedAt", out var ua) && DateTime.TryParse(ua.S, out var dtUa) ? dtUa : DateTime.UtcNow
        };
    }

    private Buyer DeserializeBuyer(Dictionary<string, AttributeValue> item)
    {
        return new Buyer
        {
            BuyerId = GetString(item, "BuyerId"),
            CompanyName = GetString(item, "CompanyName"),
            RegistrationNumber = GetString(item, "RegistrationNumber"),
            Industry = GetString(item, "Industry"),
            ContactEmail = GetString(item, "ContactEmail"),
            ContactPhone = GetString(item, "ContactPhone"),
            Address = GetString(item, "Address"),
            CreditRating = item.TryGetValue("CreditRating", out var cr) && Enum.TryParse<CreditRating>(cr.S, out var r) ? r : CreditRating.Standard,
            IsActive = GetBool(item, "IsActive", true),
            CreatedAt = item.TryGetValue("CreatedAt", out var ca) && DateTime.TryParse(ca.S, out var dtCa) ? dtCa : DateTime.UtcNow,
            PaymentHistory = item.ContainsKey("PaymentHistory")
                ? JsonSerializer.Deserialize<PaymentHistory>(item["PaymentHistory"].S) ?? new PaymentHistory()
                : new PaymentHistory()
        };
    }

    private SME DeserializeSME(Dictionary<string, AttributeValue> item)
    {
        return new SME
        {
            SmeId = GetString(item, "SmeId"),
            CompanyName = GetString(item, "CompanyName"),
            RegistrationNumber = GetString(item, "RegistrationNumber"),
            Industry = GetString(item, "Industry"),
            YearsInOperation = GetInt(item, "YearsInOperation"),
            AnnualRevenue = GetDecimal(item, "AnnualRevenue"),
            ContactEmail = GetString(item, "ContactEmail"),
            ContactPhone = GetString(item, "ContactPhone"),
            Address = GetString(item, "Address"),
            BankAccountNumber = GetString(item, "BankAccountNumber"),
            IsVerified = GetBool(item, "IsVerified", false),
            VerificationDate = item.TryGetValue("VerificationDate", out var vd) && DateTime.TryParse(vd.S, out var dtVd) ? dtVd : null,
            CreatedAt = item.TryGetValue("CreatedAt", out var ca) && DateTime.TryParse(ca.S, out var dtCa) ? dtCa : DateTime.UtcNow
        };
    }

}