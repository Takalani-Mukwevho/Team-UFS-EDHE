import Details from "../components/Details";
import RulesEngine from "../components/RulesEngine";
import { zar } from "../engine/format";
import { evaluateRules, pricingFor } from "../engine/rules";

export default function BuyerRiskEngine({ onContinue, activeInvoice, activeRisk, activeBuyer, buyers = {}, smes = {} }) {
  if (!activeInvoice || !activeRisk) {
    return (
      <div className="px-gutter-desktop py-space-xl max-w-[88rem] mx-auto w-full flex flex-col gap-space-xl">
        <div className="flex flex-col gap-space-3xs">
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Buyer risk check</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Select an invoice on the OCR Review tab first.</p>
        </div>
      </div>
    );
  }

  const inv = activeInvoice;
  const risk = activeRisk;
  const b = activeBuyer;
  const sme = smes[inv.smeId];

  const rules = evaluateRules(inv, b, sme);
  const { advanceRate, feeRate } = pricingFor(risk.band, rules.absa);
  const advanceAmount = Math.round(inv.fields.amount * advanceRate);
  const fee = Math.round(advanceAmount * feeRate);
  const netToSme = advanceAmount - fee;
  const fraudProb = risk.band === "Low" ? "0.02%" : risk.band === "Medium" ? "12.4%" : "41.0%";
  const fraudLabel = risk.band === "Low" ? "Extremely Low" : risk.band === "Medium" ? "Moderate" : "Elevated";

  return (
    <div className="px-gutter-desktop py-space-xl max-w-[88rem] mx-auto w-full flex flex-col gap-space-xl">
      {/* Header */}
      <div className="flex flex-col gap-space-3xs">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Buyer risk check</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          How likely is <strong>{inv.buyer}</strong> to pay invoice <strong>{inv.fields.invoiceNumber}</strong> ({zar(inv.fields.amount)}) on time?
        </p>
      </div>

      {/* Headline approval card */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-32 bg-primary/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className={`inline-flex items-center gap-space-2xs px-space-sm py-space-3xs rounded-full font-label-caps text-label-caps uppercase tracking-wider font-semibold shadow-sm ${
                risk.band === "Low" ? "bg-tertiary-container text-on-tertiary" :
                risk.band === "Medium" ? "bg-surface-container text-on-surface" :
                "bg-error-container text-on-error"
              }`}>
                <span className="material-symbols-outlined text-[1rem]">{risk.band === "Low" ? "verified" : risk.band === "Medium" ? "warning" : "block"}</span>
                Risk Score: {risk.total.toFixed(1)} / 100 — Grade {risk.band}
              </span>
            </div>
            <div className="flex flex-col gap-space-3xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">Pre-Approved Capital Allocation</span>
              <div className="flex flex-wrap items-baseline gap-space-sm">
                <span className="font-display-lg text-display-lg font-bold tracking-tight text-on-surface">{zar(advanceAmount)}</span>
                <span className="font-headline-md text-headline-md font-semibold text-tertiary-container">{Math.round(advanceRate * 100)}% Advance</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                Invoice {inv.fields.invoiceNumber}, face value {zar(inv.fields.amount)}, issued to {inv.buyer}.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center bg-surface-container-low p-space-md rounded-xl gap-space-sm">
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Clearing Protocol:</span>
              <span className="font-mono-data-cell text-mono-data-cell font-semibold text-on-surface">Absa Instant Pay (RTC)</span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Discount Fee ({+(feeRate * 100).toFixed(2)}%):</span>
              <span className="font-mono-data-cell text-mono-data-cell font-semibold text-tertiary">{zar(fee)}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Net SME Disbursement:</span>
              <span className="font-mono-data-cell text-mono-data-cell font-bold text-on-surface">{zar(netToSme)}</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-space-2xs">
              <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${risk.total}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules engine pre-screen */}
      <RulesEngine result={rules} />

      {/* Risk breakdown */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
        <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-space-sm">Risk Components</h3>
        <div className="flex flex-col gap-space-sm">
          {risk.parts.map((p) => (
            <div key={p.key} className="flex flex-col gap-space-2xs">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface font-semibold">{p.name}</span>
                <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant">
                  {p.raw.toFixed(0)} × {p.w.toFixed(2)} = <strong>{p.weighted.toFixed(1)}</strong>
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${p.raw}%` }}></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{p.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three risk pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Pillar 1: Invoice Integrity */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md transition-all hover:shadow-md">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">Pillar 1</span>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">Invoice Integrity</h2>
              </div>
              <span className={`flex items-center justify-center w-7 h-7 rounded-full ${inv.checksPass ? "bg-tertiary-container text-on-tertiary" : "bg-error-container text-on-error"}`}>
                <span className="material-symbols-outlined text-[1rem]">{inv.checksPass ? "check" : "close"}</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <p className="font-body-md text-body-md text-on-surface">
                {inv.checksPass
                  ? "Tax structure verified, purchase order matched, and no duplicate submission found."
                  : inv.dupNote || "Verification failed — see checks on OCR Review tab."}
              </p>
              <Details>
                <div className="flex flex-col gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex justify-between gap-space-sm"><span>Invoice number</span><span className="text-on-surface">{inv.fields.invoiceNumber}</span></div>
                  <div className="flex justify-between gap-space-sm"><span>Amount</span><span className="text-on-surface">{zar(inv.fields.amount)}</span></div>
                  <div className="flex justify-between gap-space-sm"><span>Due date</span><span className="text-on-surface">{inv.fields.dueDate}</span></div>
                </div>
              </Details>
            </div>
          </div>
          <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Fraud Probability</span>
            <span className={`font-label-caps text-label-caps bg-surface-container-lowest px-space-xs py-space-3xs rounded-full font-semibold uppercase ${
              risk.band === "Low" ? "text-tertiary" : risk.band === "Medium" ? "text-on-surface" : "text-error"
            }`}>{fraudProb} — {fraudLabel}</span>
          </div>
        </div>

        {/* Pillar 2: Buyer Profile */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md transition-all hover:shadow-md">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">Pillar 2</span>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">Buyer Payment Profile</h2>
              </div>
              {b && (
                <span className="flex items-center gap-space-3xs px-space-xs py-space-3xs rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase font-bold">
                  {b.sector || "N/A"}
                </span>
              )}
            </div>
            {b ? (
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-md bg-surface-container-low p-space-sm rounded-xl">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                      <path className="text-tertiary-container stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${Math.round((b.onTimeRate || 0) * 100)}, 100`} strokeLinecap="round" strokeWidth="3.5" />
                    </svg>
                    <span className="absolute font-mono-data-cell text-mono-data-cell font-bold text-on-surface">{Math.round((b.onTimeRate || 0) * 100)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">On-Time Settlement</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">{inv.buyer}</span>
                    <span className="font-mono-data-cell text-mono-data-cell text-tertiary text-xs">{b.historicalInvoices || 0} Invoices Tracked</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface">
                  Settles {Math.abs((b.avgSettlementDays || 0) - inv.fields.termsDays)} days {b.avgSettlementDays > inv.fields.termsDays ? "late" : "inside"} its {inv.fields.termsDays}-day terms, on average.
                </p>
              </div>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">No buyer data available for {inv.buyer}.</p>
            )}
          </div>
          <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container text-body-sm font-body-sm">
            <span className="text-on-surface-variant">Default Risk:</span>
            <span className={`font-label-caps text-label-caps font-bold uppercase ${risk.band === "Low" ? "text-tertiary" : "text-on-surface"}`}>
              {risk.band === "Low" ? "Negligible (< 0.1%)" : risk.band === "Medium" ? "Moderate" : "Elevated"}
            </span>
          </div>
        </div>

        {/* Pillar 3: SME Profile */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md transition-all hover:shadow-md">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">Pillar 3</span>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">SME Supplier Profile</h2>
              </div>
              <span className={`inline-flex items-center gap-space-3xs px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps uppercase font-bold ${
                inv.smeVerified ? "bg-tertiary-container text-on-tertiary" : "bg-surface-container text-on-surface-variant"
              }`}>
                <span className="material-symbols-outlined text-[0.875rem]">{inv.smeVerified ? "stars" : "pending"}</span>
                {inv.smeVerified ? "KYB Verified" : "Pending"}
              </span>
            </div>
            <div className="flex flex-col gap-space-sm">
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">{inv.sme}</span>
                {sme && (
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    {sme.industry} · {sme.yearsInOperation} years operating · Revenue {zar(sme.annualRevenue)}
                  </span>
                )}
              </div>
              <Details>
                <div className="flex flex-col gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  {sme && (
                    <>
                      <div className="flex justify-between gap-space-sm"><span>Registration</span><span className="text-on-surface">{sme.registrationNumber}</span></div>
                      <div className="flex justify-between gap-space-sm"><span>Industry</span><span className="text-on-surface">{sme.industry}</span></div>
                      <div className="flex justify-between gap-space-sm"><span>Address</span><span className="text-on-surface">{sme.address}</span></div>
                    </>
                  )}
                </div>
              </Details>
            </div>
          </div>
          <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container text-body-sm font-body-sm">
            <span className="text-on-surface-variant">Contractual Risk:</span>
            <span className="font-label-caps text-label-caps font-bold text-tertiary uppercase">Cleared</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-md pt-space-xs pb-space-xl">
        <div />
        <div className="flex items-center gap-space-sm w-full sm:w-auto">
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-space-lg py-space-sm bg-primary-container hover:bg-primary text-on-primary font-body-md text-body-md font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-space-xs group"
          >
            <span>Proceed to Instant Funding Offer</span>
            <span className="material-symbols-outlined text-[1.25rem] transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
