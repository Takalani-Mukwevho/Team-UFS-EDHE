using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public class VerificationService : IVerificationService
{
    private readonly IDynamoService _dynamoService;

    public VerificationService()
    {
        _dynamoService = new DynamoService();
    }

    public VerificationService(IDynamoService dynamoService)
    {
        _dynamoService = dynamoService;
    }

    public async Task<VerificationResult> VerifyAsync(Invoice invoice)
    {
        var result = new VerificationResult();

        result.SMEValid = await VerifySMEAsync(invoice.SmeId);
        if (!result.SMEValid)
        {
            result.Errors.Add("SME is not verified or does not exist");
        }

        result.InvoiceValid = ValidateInvoice(invoice);
        if (!result.InvoiceValid)
        {
            result.Errors.Add("Invoice data is invalid or incomplete");
        }

        result.BuyerValid = await VerifyBuyerAsync(invoice.BuyerId);
        if (!result.BuyerValid)
        {
            result.Errors.Add("Buyer does not exist or is inactive");
        }

        result.NoDuplicates = await CheckForDuplicatesAsync(invoice);
        if (!result.NoDuplicates)
        {
            result.Warnings.Add("Potential duplicate invoice detected");
        }

        result.IsValid = result.SMEValid && result.InvoiceValid && result.BuyerValid;
        return result;
    }

    private async Task<bool> VerifySMEAsync(string smeId)
    {
        var sme = await _dynamoService.GetSMEAsync(smeId);
        return sme != null && sme.IsVerified;
    }

    private bool ValidateInvoice(Invoice invoice)
    {
        if (string.IsNullOrEmpty(invoice.InvoiceNumber))
            return false;

        if (invoice.Amount <= 0)
            return false;

        if (invoice.DueDate <= invoice.IssueDate)
            return false;

        if (invoice.ExtractedData == null)
            return false;

        return true;
    }

    private async Task<bool> VerifyBuyerAsync(string buyerId)
    {
        var buyer = await _dynamoService.GetBuyerAsync(buyerId);
        return buyer != null && buyer.IsActive;
    }

    private async Task<bool> CheckForDuplicatesAsync(Invoice invoice)
    {
        var existingInvoices = await _dynamoService.GetInvoicesBySmeAsync(invoice.SmeId);
        var duplicate = existingInvoices.FirstOrDefault(i =>
            i.InvoiceId != invoice.InvoiceId &&
            i.InvoiceNumber == invoice.InvoiceNumber &&
            i.BuyerId == invoice.BuyerId &&
            Math.Abs(i.Amount - invoice.Amount) < 0.01m);

        return duplicate == null;
    }
}
