using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public interface IRiskEngineService
{
    FundingDecision Evaluate(Invoice invoice, Buyer buyer, SME sme);
}
