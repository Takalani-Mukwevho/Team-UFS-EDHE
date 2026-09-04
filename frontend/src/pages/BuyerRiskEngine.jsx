import Details from "../components/Details";

export default function BuyerRiskEngine({ onContinue }) {
  return (
    <div className="px-gutter-desktop py-space-xl max-w-[88rem] mx-auto w-full flex flex-col gap-space-xl">
      <div className="flex flex-col gap-space-3xs">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
          Buyer risk check
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          How likely is XYZ Corporation to pay this invoice on time?
        </p>
      </div>

      {/* Headline approval card */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-32 bg-primary/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="inline-flex items-center gap-space-2xs bg-tertiary-container text-on-tertiary px-space-sm py-space-3xs rounded-full font-label-caps text-label-caps uppercase tracking-wider font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[1rem]">verified</span>
                Invoice Funding Risk: Grade A
              </span>
            </div>
            <div className="flex flex-col gap-space-3xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                Pre-Approved Capital Allocation
              </span>
              <div className="flex flex-wrap items-baseline gap-space-sm">
                <span className="font-display-lg text-display-lg font-bold tracking-tight text-on-surface">
                  R 148,000.00
                </span>
                <span className="font-headline-md text-headline-md font-semibold text-tertiary-container">
                  80% Liquidity Advance
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                Invoice INV-1042, face value R 185,000.00, issued to XYZ Corporation.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center bg-surface-container-low p-space-md rounded-xl gap-space-sm">
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Clearing Protocol:</span>
              <span className="font-mono-data-cell text-mono-data-cell font-semibold text-on-surface">
                Absa Instant Pay (RTC)
              </span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Recommended Single Fee:</span>
              <span className="font-mono-data-cell text-mono-data-cell font-semibold text-tertiary">
                2.00% (R 2,960.00)
              </span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Net SME Disbursement:</span>
              <span className="font-mono-data-cell text-mono-data-cell font-bold text-on-surface">
                R 145,040.00
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-space-2xs">
              <div className="h-full bg-tertiary-container rounded-full w-4/5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Three risk pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Pillar 1: Fraud & Integrity */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md transition-all hover:shadow-md">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Pillar 1
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Invoice Integrity &amp; Fraud
                </h2>
              </div>
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary">
                <span className="material-symbols-outlined text-[1rem]">check</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <p className="font-body-md text-body-md text-on-surface">
                Tax structure verified, purchase order matched 1:1, and no duplicate submission found.
              </p>
              <Details>
                <div className="flex flex-col gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex justify-between gap-space-sm"><span>VAT registration</span><span className="text-on-surface">#4090184491</span></div>
                  <div className="flex justify-between gap-space-sm"><span>ERP purchase order</span><span className="text-on-surface">SAP-PO-882944-ZA</span></div>
                  <div className="flex justify-between gap-space-sm"><span>Duplicate screening</span><span className="text-on-surface">14 clearing nodes, 0 matches</span></div>
                </div>
              </Details>
            </div>
          </div>
          <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Fraud Probability
              </span>
              <span className="font-mono-currency text-mono-currency text-tertiary font-bold">0.02%</span>
            </div>
            <span className="font-label-caps text-label-caps bg-surface-container-lowest px-space-xs py-space-3xs rounded-full text-tertiary font-semibold uppercase">
              Extremely Low
            </span>
          </div>
        </div>

        {/* Pillar 2: Enterprise Buyer Profile */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md transition-all hover:shadow-md">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Pillar 2
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Enterprise Buyer Profile
                </h2>
              </div>
              <span className="flex items-center gap-space-3xs px-space-xs py-space-3xs rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase font-bold">
                Tier-1 Corp
              </span>
            </div>
            <div className="flex items-center gap-space-md bg-surface-container-low p-space-sm rounded-xl">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-tertiary-container stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="96, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-mono-data-cell text-mono-data-cell font-bold text-on-surface">
                  96%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">On-Time Settlement</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  XYZ Corporation (Pty) Ltd
                </span>
                <span className="font-mono-data-cell text-mono-data-cell text-tertiary text-xs">
                  142 Invoices Tracked
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <p className="font-body-md text-body-md text-on-surface">
                Settles 32 days inside its own 60-day terms, on average.
              </p>
              <Details>
                <div className="flex flex-col gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex justify-between gap-space-sm"><span>Bureau rating</span><span className="text-on-surface">AAA- (Absa Corporate)</span></div>
                  <div className="flex justify-between gap-space-sm"><span>Settlement velocity</span><span className="text-on-surface">28 days average</span></div>
                </div>
              </Details>
            </div>
          </div>
          <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container text-body-sm font-body-sm">
            <span className="text-on-surface-variant">Default Risk:</span>
            <span className="font-label-caps text-label-caps font-bold text-tertiary uppercase">
              Negligible (&lt; 0.1%)
            </span>
          </div>
        </div>

        {/* Pillar 3: SME Performance History */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md transition-all hover:shadow-md">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Pillar 3
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">
                  SME Performance History
                </h2>
              </div>
              <span className="inline-flex items-center gap-space-3xs px-space-xs py-space-3xs rounded-full bg-surface-container text-tertiary font-label-caps text-label-caps uppercase font-bold">
                <span className="material-symbols-outlined text-[0.875rem]">stars</span>
                Top Quartile
              </span>
            </div>
            <div className="flex items-center gap-space-md p-space-sm bg-surface-container-low rounded-xl">
              <div className="flex flex-col items-center justify-center p-space-xs bg-surface-container-lowest rounded-lg min-w-[4rem]">
                <span className="font-mono-currency text-mono-currency font-bold text-on-surface leading-none">
                  4.9
                </span>
                <span className="text-[0.625rem] text-on-surface-variant font-mono-data-cell">/ 5.0 Rating</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  ABC Construction (Pty) Ltd
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  0 Disputes / 18 Contracts
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <p className="font-body-md text-body-md text-on-surface">
                18 contracts delivered, none disputed.
              </p>
              <Details>
                <div className="flex flex-col gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex justify-between gap-space-sm"><span>Fulfilment cycle</span><span className="text-on-surface">14 days, on schedule</span></div>
                  <div className="flex justify-between gap-space-sm"><span>Supplier KYB tier</span><span className="text-on-surface">Gold</span></div>
                  <div className="flex justify-between gap-space-sm"><span>Retention</span><span className="text-on-surface">100% repeat debtor</span></div>
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



      {/* Footer actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-md pt-space-xs pb-space-xl">
          <div />
        <div className="flex items-center gap-space-sm w-full sm:w-auto">
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-space-lg py-space-sm bg-primary-container hover:bg-primary text-on-primary font-body-md text-body-md font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-space-xs group"
          >
            <span>Proceed to Instant Funding Offer</span>
            <span className="material-symbols-outlined text-[1.25rem] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
