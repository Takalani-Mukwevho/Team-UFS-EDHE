using Amazon.Textract;
using Amazon.Textract.Model;
using InvoiceProcessing.Models;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;

namespace InvoiceProcessing.Services;

public class TextractService : ITextractService
{
    private readonly IAmazonTextract? _textractClient;
    private readonly string _bucketName;

    public TextractService()
    {
        try
        {
            _textractClient = new AmazonTextractClient();
        }
        catch
        {
            _textractClient = null;
        }
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "invoice-uploads";
    }

    public TextractService(IAmazonTextract textractClient)
    {
        _textractClient = textractClient;
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "invoice-uploads";
    }

    public async Task<ExtractedData> AnalyzeDocumentAsync(string s3Key)
    {
        // Try Textract first if client is available
        if (_textractClient != null)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
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
                    FeatureTypes = new List<string> { "TABLES", "FORMS" }
                };

                var response = await _textractClient.AnalyzeDocumentAsync(request, cts.Token);
                return ParseTextractResponse(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Textract S3 extraction failed or unavailable: {ex.Message}. Falling back to native stream parser.");
            }
        }

        return new ExtractedData();
    }

    public async Task<ExtractedData> AnalyzeDocumentAsync(byte[] documentBytes, string contentType)
    {
        // 1. First try native PDF stream extraction (instant, reliable, zero-region dependency)
        if (contentType.Contains("pdf") || (documentBytes.Length > 4 && documentBytes[0] == 0x25 && documentBytes[1] == 0x50 && documentBytes[2] == 0x44 && documentBytes[3] == 0x46))
        {
            try
            {
                var nativeResult = ExtractFromPdfBytes(documentBytes);
                if (!string.IsNullOrEmpty(nativeResult.InvoiceNumber) || nativeResult.TotalAmount > 0 || nativeResult.LineItems.Count > 0)
                {
                    return nativeResult;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Native PDF extraction warning: {ex.Message}");
            }
        }

        // 2. Try AWS Textract if available
        if (_textractClient != null)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                using var stream = new MemoryStream(documentBytes);
                var request = new AnalyzeDocumentRequest
                {
                    Document = new Document { Bytes = stream },
                    FeatureTypes = new List<string> { "TABLES", "FORMS" }
                };

                var response = await _textractClient.AnalyzeDocumentAsync(request, cts.Token);
                return ParseTextractResponse(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Textract byte extraction failed: {ex.Message}");
            }
        }

        return ExtractFromPdfBytes(documentBytes);
    }

    public static ExtractedData ExtractFromPdfBytes(byte[] pdfBytes)
    {
        var rawTextBuilder = new StringBuilder();
        var streamMarker = Encoding.ASCII.GetBytes("stream");
        var endStreamMarker = Encoding.ASCII.GetBytes("endstream");

        int index = 0;
        while (index < pdfBytes.Length - streamMarker.Length)
        {
            int streamStart = IndexOf(pdfBytes, streamMarker, index);
            if (streamStart == -1) break;

            int contentStart = streamStart + streamMarker.Length;
            while (contentStart < pdfBytes.Length && (pdfBytes[contentStart] == 10 || pdfBytes[contentStart] == 13))
            {
                contentStart++;
            }

            int endStream = IndexOf(pdfBytes, endStreamMarker, contentStart);
            if (endStream == -1) break;

            int contentEnd = endStream;
            while (contentEnd > contentStart && (pdfBytes[contentEnd - 1] == 10 || pdfBytes[contentEnd - 1] == 13))
            {
                contentEnd--;
            }

            if (contentEnd > contentStart)
            {
                var compressed = new byte[contentEnd - contentStart];
                Array.Copy(pdfBytes, contentStart, compressed, 0, compressed.Length);

                string? decompText = null;

                // Try ZLibStream
                try
                {
                    using var ms = new MemoryStream(compressed);
                    using var zlib = new ZLibStream(ms, CompressionMode.Decompress);
                    using var reader = new StreamReader(zlib, Encoding.Latin1);
                    decompText = reader.ReadToEnd();
                }
                catch
                {
                    // Try DeflateStream
                    try
                    {
                        using var ms = new MemoryStream(compressed);
                        using var deflate = new DeflateStream(ms, CompressionMode.Decompress);
                        using var reader = new StreamReader(deflate, Encoding.Latin1);
                        decompText = reader.ReadToEnd();
                    }
                    catch
                    {
                        decompText = Encoding.Latin1.GetString(compressed);
                    }
                }

                if (!string.IsNullOrEmpty(decompText))
                {
                    rawTextBuilder.AppendLine(decompText);
                }
            }

            index = endStream + endStreamMarker.Length;
        }

        return ParseInvoiceText(rawTextBuilder.ToString());
    }

    private static int IndexOf(byte[] source, byte[] pattern, int startIndex)
    {
        for (int i = startIndex; i <= source.Length - pattern.Length; i++)
        {
            bool match = true;
            for (int j = 0; j < pattern.Length; j++)
            {
                if (source[i + j] != pattern[j])
                {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
    }

    public static ExtractedData ParseInvoiceText(string rawStreamText)
    {
        var data = new ExtractedData();
        var lines = new List<string>();

        // Extract text inside (text) Tj
        var tjMatches = Regex.Matches(rawStreamText, @"\((.*?)\)\s*Tj");
        foreach (Match m in tjMatches)
        {
            var line = m.Groups[1].Value
                .Replace(@"\(", "(")
                .Replace(@"\)", ")")
                .Replace(@"\\", "\\")
                .Trim();
            if (!string.IsNullOrEmpty(line))
            {
                lines.Add(line);
            }
        }

        data.RawText = string.Join("\n", lines);
        string section = "";
        bool readingLineItems = false;

        for (int i = 0; i < lines.Count; i++)
        {
            var line = lines[i];

            if (Regex.IsMatch(line, @"^Invoice Number:\s*(.*)", RegexOptions.IgnoreCase))
            {
                data.InvoiceNumber = Regex.Match(line, @"^Invoice Number:\s*(.*)", RegexOptions.IgnoreCase).Groups[1].Value.Trim();
            }
            else if (Regex.IsMatch(line, @"^Subtotal\s*\(Excl\.\s*VAT\):\s*R\s*([0-9,.]+)", RegexOptions.IgnoreCase))
            {
                var val = Regex.Match(line, @"^Subtotal\s*\(Excl\.\s*VAT\):\s*R\s*([0-9,.]+)", RegexOptions.IgnoreCase).Groups[1].Value.Replace(",", "");
                if (decimal.TryParse(val, out var sub)) data.Subtotal = sub;
                readingLineItems = false;
            }
            else if (Regex.IsMatch(line, @"^VAT\s*\(15(?:\.0)?%\):\s*R\s*([0-9,.]+)", RegexOptions.IgnoreCase))
            {
                var val = Regex.Match(line, @"^VAT\s*\(15(?:\.0)?%\):\s*R\s*([0-9,.]+)", RegexOptions.IgnoreCase).Groups[1].Value.Replace(",", "");
                if (decimal.TryParse(val, out var tax)) data.TaxAmount = tax;
            }
            else if (Regex.IsMatch(line, @"^TOTAL\s*\(ZAR\):\s*R\s*([0-9,.]+)", RegexOptions.IgnoreCase))
            {
                var val = Regex.Match(line, @"^TOTAL\s*\(ZAR\):\s*R\s*([0-9,.]+)", RegexOptions.IgnoreCase).Groups[1].Value.Replace(",", "");
                if (decimal.TryParse(val, out var tot)) data.TotalAmount = tot;
            }
            else if (line == "FROM:")
            {
                section = "FROM";
            }
            else if (line == "BILL TO:")
            {
                section = "BILL TO";
            }
            else if (line.StartsWith("Description") && line.Contains("Qty") && line.Contains("Amount"))
            {
                readingLineItems = true;
                section = "";
            }
            else if (line.StartsWith("---"))
            {
                // separator
            }
            else if (section == "FROM")
            {
                if (string.IsNullOrEmpty(data.VendorName))
                    data.VendorName = line;
                else if (string.IsNullOrEmpty(data.VendorAddress))
                    data.VendorAddress = line;
            }
            else if (section == "BILL TO")
            {
                if (string.IsNullOrEmpty(data.BuyerName))
                    data.BuyerName = line;
                else if (string.IsNullOrEmpty(data.BuyerAddress))
                    data.BuyerAddress = line;
            }
            else if (readingLineItems)
            {
                var match = Regex.Match(line, @"^(.*?)\s+(\d+)\s+R\s*([0-9,.]+)\s+R\s*([0-9,.]+)$");
                if (match.Success)
                {
                    var desc = match.Groups[1].Value.Trim();
                    decimal.TryParse(match.Groups[2].Value, out var qty);
                    decimal.TryParse(match.Groups[3].Value.Replace(",", ""), out var unit);
                    decimal.TryParse(match.Groups[4].Value.Replace(",", ""), out var amt);

                    data.LineItems.Add(new LineItem
                    {
                        Description = desc,
                        Quantity = qty,
                        UnitPrice = unit,
                        Amount = amt
                    });
                }
            }
        }

        if (data.Subtotal == 0 && data.LineItems.Count > 0)
        {
            data.Subtotal = data.LineItems.Sum(li => li.Amount);
        }
        if (data.TaxAmount == 0 && data.Subtotal > 0)
        {
            data.TaxAmount = Math.Round(data.Subtotal * 0.15m, 2);
        }
        if (data.TotalAmount == 0)
        {
            data.TotalAmount = data.Subtotal + data.TaxAmount;
        }

        return data;
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
