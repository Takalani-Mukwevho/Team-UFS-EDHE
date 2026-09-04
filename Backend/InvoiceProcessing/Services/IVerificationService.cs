using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public interface IVerificationService
{
    Task<VerificationResult> VerifyAsync(Invoice invoice);
}

public class VerificationResult
{
    public bool IsValid { get; set; }
    public bool SMEValid { get; set; }
    public bool InvoiceValid { get; set; }
    public bool BuyerValid { get; set; }
    public bool NoDuplicates { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
