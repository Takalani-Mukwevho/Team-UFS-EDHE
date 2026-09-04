using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public interface IBedrockService
{
    Task<string> GenerateFundingSummaryAsync(
        Invoice invoice, Buyer buyer, SME sme, FundingDecision decision);
}
