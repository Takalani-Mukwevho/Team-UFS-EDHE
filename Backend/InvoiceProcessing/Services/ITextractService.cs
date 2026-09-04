using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public interface ITextractService
{
    Task<ExtractedData> AnalyzeDocumentAsync(string s3Key);
    Task<ExtractedData> AnalyzeDocumentAsync(byte[] documentBytes, string contentType);
}
