using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public class RiskEngineService : IRiskEngineService
{
    public FundingDecision Evaluate(Invoice invoice, Buyer buyer, SME sme)
    {
        var riskScore = CalculateRiskScore(invoice, buyer, sme);
        var decision = MakeDecision(riskScore, invoice);

        return new FundingDecision
        {
            InvoiceId = invoice.InvoiceId,
            Outcome = decision,
            ApprovedAmount = decision == Decision.Approved ? invoice.Amount * 0.85m : 0,
            FundingRate = 0.85m,
            RiskScore = riskScore,
            Conditions = GetConditions(riskScore),
            RejectionReason = decision == Decision.Rejected ? GetRejectionReason(riskScore) : null
        };
    }

    private RiskScore CalculateRiskScore(Invoice invoice, Buyer buyer, SME sme)
    {
        var factors = new List<RiskFactor>();

        var buyerRisk = 0m;
        if (buyer.CreditRating == CreditRating.Excellent)
        {
            factors.Add(new RiskFactor { Name = "Buyer Credit Rating", Description = "Excellent credit rating", Impact = -0.2m, IsPositive = true });
            buyerRisk -= 0.2m;
        }
        else if (buyer.CreditRating == CreditRating.Poor)
        {
            factors.Add(new RiskFactor { Name = "Buyer Credit Rating", Description = "Poor credit rating", Impact = 0.3m, IsPositive = false });
            buyerRisk += 0.3m;
        }

        if (buyer.PaymentHistory.AveragePaymentDays > 60)
        {
            factors.Add(new RiskFactor { Name = "Payment History", Description = $"Average payment time: {buyer.PaymentHistory.AveragePaymentDays} days", Impact = 0.2m, IsPositive = false });
            buyerRisk += 0.2m;
        }

        var smeRisk = 0m;
        if (sme.YearsInOperation < 2)
        {
            factors.Add(new RiskFactor { Name = "Business Age", Description = $"Only {sme.YearsInOperation} years in operation", Impact = 0.15m, IsPositive = false });
            smeRisk += 0.15m;
        }
        else if (sme.YearsInOperation > 5)
        {
            factors.Add(new RiskFactor { Name = "Business Age", Description = $"Established business: {sme.YearsInOperation} years", Impact = -0.1m, IsPositive = true });
            smeRisk -= 0.1m;
        }

        var invoiceRisk = 0m;
        if (invoice.Amount > 500000)
        {
            factors.Add(new RiskFactor { Name = "Invoice Amount", Description = $"Large invoice: R{invoice.Amount:N2}", Impact = 0.1m, IsPositive = false });
            invoiceRisk += 0.1m;
        }

        var daysUntilDue = (invoice.DueDate - DateTime.UtcNow).Days;
        if (daysUntilDue < 30)
        {
            factors.Add(new RiskFactor { Name = "Payment Terms", Description = $"Short payment terms: {daysUntilDue} days", Impact = 0.05m, IsPositive = false });
            invoiceRisk += 0.05m;
        }

        var overall = Math.Clamp((buyerRisk + smeRisk + invoiceRisk + 0.5m) / 2m, 0m, 1m);

        return new RiskScore
        {
            Overall = Math.Round(overall, 2),
            BuyerRisk = Math.Clamp(buyerRisk + 0.5m, 0m, 1m),
            SME = Math.Clamp(smeRisk + 0.5m, 0m, 1m),
            InvoiceRisk = Math.Clamp(invoiceRisk + 0.5m, 0m, 1m),
            Factors = factors
        };
    }

    private Decision MakeDecision(RiskScore riskScore, Invoice invoice)
    {
        if (riskScore.Overall < 0.4m)
            return Decision.Approved;
        else if (riskScore.Overall < 0.6m)
            return Decision.ConditionalApproval;
        else
            return Decision.Rejected;
    }

    private List<string> GetConditions(RiskScore riskScore)
    {
        var conditions = new List<string>();

        if (riskScore.Overall >= 0.4m)
        {
            conditions.Add("Requires additional documentation");
            conditions.Add("Maximum 85% funding rate applied");
        }

        if (riskScore.BuyerRisk > 0.6m)
        {
            conditions.Add("Buyer credit check required");
        }

        return conditions;
    }

    private string GetRejectionReason(RiskScore riskScore)
    {
        if (riskScore.Overall >= 0.7m)
            return "Risk score too high for funding";
        if (riskScore.BuyerRisk > 0.7m)
            return "Buyer credit risk unacceptable";
        if (riskScore.SME > 0.7m)
            return "SME risk profile does not meet criteria";

        return "Overall risk assessment failed";
    }
}
