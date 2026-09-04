using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public interface IDynamoService
{
    Task SaveInvoiceAsync(Invoice invoice);
    Task<Invoice?> GetInvoiceAsync(string invoiceId);
    Task<List<Invoice>> GetInvoicesBySmeAsync(string smeId);
    Task<List<Invoice>> GetInvoicesByBuyerAsync(string buyerId);

    Task SaveBuyerAsync(Buyer buyer);
    Task<Buyer?> GetBuyerAsync(string buyerId);

    Task SaveSMEAsync(SME sme);
    Task<SME?> GetSMEAsync(string smeId);
}
