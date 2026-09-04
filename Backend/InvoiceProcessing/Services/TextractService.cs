using Amazon.Textract;
using Amazon.Textract.Model;
using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public class TextractService : ITextractService
{
    private readonly IAmazonTextract _textractClient;
    private readonly string _bucketName;

    public TextractService()
    {
        _textractClient = new AmazonTextractClient();
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "invoice-uploads";
    }

    public TextractService(IAmazonTextract textractClient)
    {
        _textractClient = textractClient;
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "invoice-uploads";
    }

    public async Task<ExtractedData> AnalyzeDocumentAsync(string s3Key)
    {
        var request = new AnalyzeDocumentRequest
        {
            Document = new Document
            {
                S3Object = new S3Object
                {
                    Bucket = _bucketName,
                    Name = s3Key
                }
            },
            FeatureTypes = new List<string>
            {
                "TABLES",
                "FORMS"
            }
        };

        var response = await _textractClient.AnalyzeDocumentAsync(request);
        return ParseTextractResponse(response);
    }

    public async Task<ExtractedData> AnalyzeDocumentAsync(byte[] documentBytes, string contentType)
    {
        using var stream = new MemoryStream(documentBytes);
        var request = new AnalyzeDocumentRequest
        {
            Document = new Document
            {
                Bytes = stream
            },
            FeatureTypes = new List<string>
            {
                "TABLES",
                "FORMS"
            }
        };

        var response = await _textractClient.AnalyzeDocumentAsync(request);
        return ParseTextractResponse(response);
    }

    private ExtractedData ParseTextractResponse(AnalyzeDocumentResponse response)
    {
        var extracted = new ExtractedData();
        var blocks = response.Blocks;

        var allText = new List<string>();
        foreach (var block in blocks.Where(b => b.BlockType == BlockType.LINE))
        {
            if (!string.IsNullOrEmpty(block.Text))
            {
                allText.Add(block.Text);
            }
        }
        extracted.RawText = string.Join("\n", allText);

        var keyValues = blocks
            .Where(b => b.BlockType == BlockType.KEY_VALUE_SET)
            .ToList();

        foreach (var kv in keyValues)
        {
            var key = GetKeyValue(blocks, kv, true);
            var value = GetKeyValue(blocks, kv, false);

            if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(value))
                continue;

            var keyLower = key.ToLowerInvariant();
            if (keyLower.Contains("vendor") || keyLower.Contains("from"))
                extracted.VendorName = value;
            else if (keyLower.Contains("bill to") || keyLower.Contains("customer"))
                extracted.BuyerName = value;
            else if (keyLower.Contains("invoice number") || keyLower.Contains("inv #"))
                extracted.InvoiceNumber = value;
            else if (keyLower.Contains("total"))
            {
                if (decimal.TryParse(value.Replace("R", "").Replace(",", "").Trim(), out var total))
                    extracted.TotalAmount = total;
            }
            else if (keyLower.Contains("tax") || keyLower.Contains("vat"))
            {
                if (decimal.TryParse(value.Replace("R", "").Replace(",", "").Trim(), out var tax))
                    extracted.TaxAmount = tax;
            }
        }

        var tables = blocks.Where(b => b.BlockType == BlockType.TABLE).ToList();
        foreach (var table in tables)
        {
            var rows = GetTableRows(blocks, table);
            foreach (var row in rows.Skip(1))
            {
                if (row.Count >= 3)
                {
                    var lineItem = new LineItem
                    {
                        Description = row[0],
                        Quantity = decimal.TryParse(row[1], out var qty) ? qty : 0,
                        Amount = decimal.TryParse(row.Last().Replace("R", "").Replace(",", "").Trim(), out var amt) ? amt : 0
                    };
                    extracted.LineItems.Add(lineItem);
                }
            }
        }

        extracted.Subtotal = extracted.TotalAmount - extracted.TaxAmount;
        return extracted;
    }

    private string GetKeyValue(List<Block> allBlocks, Block kvBlock, bool isKey)
    {
        var relType = isKey ? RelationshipType.VALUE : RelationshipType.CHILD;
        var relationships = kvBlock.Relationships?.Where(r => r.Type == relType).ToList();

        if (relationships == null || !relationships.Any())
            return string.Empty;

        var ids = relationships?.SelectMany(r => r.Ids ?? new List<string>()) ?? Enumerable.Empty<string>();
        return string.Join(" ", ids
            .Select(id => allBlocks.FirstOrDefault(b => b.Id == id))
            .Where(b => b != null && b.BlockType == BlockType.WORD)
            .Select(b => b!.Text ?? string.Empty));
    }

    private List<List<string>> GetTableRows(List<Block> allBlocks, Block tableBlock)
    {
        var rows = new List<List<string>>();
        var cellIds = tableBlock.Relationships?
            .Where(r => r.Type == RelationshipType.CHILD)
            .SelectMany(r => r.Ids ?? new List<string>())
            .ToList() ?? new List<string>();

        var cells = cellIds
            .Select(id => allBlocks.FirstOrDefault(b => b.Id == id))
            .Where(b => b != null && b.BlockType == BlockType.CELL)
            .ToList();

        var grouped = cells
            .GroupBy(c => c!.RowIndex)
            .OrderBy(g => g.Key);

        foreach (var group in grouped)
        {
            var row = group
                .OrderBy(c => c!.ColumnIndex)
                .Select(c => c!.Text ?? string.Empty)
                .ToList();
            rows.Add(row);
        }

        return rows;
    }
}
