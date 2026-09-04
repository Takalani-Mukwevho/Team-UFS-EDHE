import { useMemo, useState } from "react";
import { zar } from "../data/scenarios";

const GROSS_VALUE = 185000;
const ADVANCE_CAP = 148000; // 80% of gross
const FEE_RATE = 0.02;
const MIN_ADVANCE = 50000;

export default function InstantFundingOffer({ onContinue }) {
  const [advance, setAdvance] = useState(ADVANCE_CAP);
  const [accepted, setAccepted] = useState(true);
  const [disbursed, setDisbursed] = useState(false);

  const fee = useMemo(() => advance * FEE_RATE, [advance]);
  const net = useMemo(() => advance - fee, [advance, fee]);
  const rebate = useMemo(() => GROSS_VALUE - net, [net]);
  const pct = useMemo(() => Math.round((advance / ADVANCE_CAP) * 100), [advance]);

  function setPreset(value) {
    setAdvance(value);
  }

  const handleDisburse = () => {
    /**/
  }

  return (
    <div className="w-full flex flex-col">
      {/* Pipeline banner */}
      <section className="w-full bg-surface-container-low px-gutter-desktop py-space-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center gap-space-2xs bg-primary-container text-on-primary px-space-xs py-space-3xs rounded-full">
            <span className="material-symbols-outlined text-[1rem]">verified</span>
            <span className="font-label-caps text-label-caps tracking-widest uppercase">Stage 4 / 5 Active</span>
          </div>
          <div className="flex items-center gap-space-2xs">
            <span className="font-title-sm text-title-sm text-on-surface">Invoice Decision Gateway:</span>
            <span className="font-mono-data-cell text-mono-data-cell bg-surface-container-lowest px-space-xs py-space-3xs rounded text-primary font-semibold">
              #INV-1042
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm">
          <span className="flex items-center gap-space-3xs text-tertiary font-semibold">
            <span className="material-symbols-outlined text-[0.875rem]">check_circle</span> Debtor Validated
          </span>
          <span className="flex items-center gap-space-3xs text-tertiary font-semibold">
            <span className="material-symbols-outlined text-[0.875rem]">security</span> Underwriting Passed
          </span>
          <span className="hidden sm:flex items-center gap-space-3xs font-mono-data-cell text-mono-data-cell">
            Latency: 1.4s
          </span>
        </div>
      </section>

      <div className="max-w-container-max mx-auto w-full px-gutter-desktop py-space-xl flex flex-col gap-space-xl">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT 8-cols */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {/* 4-box metrics matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-surface-variant"></div>
                <div className="flex items-center justify-between text-on-surface-variant mb-space-sm">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">Gross Invoice Value</span>
                  <span className="material-symbols-outlined text-[1.125rem]">receipt_long</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                    {zar(GROSS_VALUE)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Debtor: XYZ Corporation (Pty) Ltd
                  </span>
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant/70">
                    Contract Terms: Net 60 Days
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
                <div className="flex items-center justify-between text-on-surface-variant mb-space-sm">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">
                    Advance Rate Ceiling
                  </span>
                  <span className="bg-surface-container-high font-mono-data-cell text-mono-data-cell px-space-xs py-space-3xs rounded text-on-surface font-bold">
                    80.00%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                    {zar(ADVANCE_CAP)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Tier-1 Institutional Debtor Tier
                  </span>
                  <span className="font-mono-data-cell text-mono-data-cell text-tertiary">
                    Full Collateral Verification Passed
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-outline-variant"></div>
                <div className="flex items-center justify-between text-on-surface-variant mb-space-sm">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">
                    Discount Fee (Flat 2.0%)
                  </span>
                  <span className="material-symbols-outlined text-[1.125rem]">percent</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                    {zar(fee)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Fixed 60-day financing charge
                  </span>
                  <span className="font-mono-data-cell text-mono-data-cell text-tertiary">
                    Zero monthly management or setup costs
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-tertiary-container"></div>
                <div className="flex items-center justify-between text-tertiary mb-space-sm">
                  <div className="flex items-center gap-space-2xs">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">
                      Net Cash Available Today
                    </span>
                  </div>
                  <span className="bg-surface-container-low text-tertiary px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps uppercase">
                    Immediate EDO
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-space-2xs">
                    <span className="font-title-sm text-title-sm text-tertiary font-bold">ZAR</span>
                    <span className="font-display-lg text-display-lg text-tertiary font-bold tracking-tight">
                      {net.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Direct instant EFT into Account ending ••4901
                  </span>
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant">
                    Cleared and ready within 120 minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                    Select Advance Facility Drawdown
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Adjust your required payout amount. Only pay factoring fees on what you withdraw.
                  </span>
                </div>
                <div className="flex items-center gap-space-2xs self-start sm:self-auto bg-surface-container-low px-space-sm py-space-xs rounded-lg">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    Current Advance:
                  </span>
                  <span className="font-mono-data-cell text-mono-data-cell text-primary font-bold">
                    {pct}% DRAWDOWN
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs py-space-xs">
                <input
                  className="w-full h-2.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                  max={ADVANCE_CAP}
                  min={MIN_ADVANCE}
                  step={1000}
                  type="range"
                  value={advance}
                  onChange={(e) => setAdvance(Number(e.target.value))}
                />
                <div className="flex items-center justify-between font-mono-data-cell text-mono-data-cell text-on-surface-variant flex-wrap gap-1">
                  <span>Min Facility: {zar(MIN_ADVANCE)} (33.7%)</span>
                  <span className="text-on-surface font-semibold">Mid: R 100,000.00</span>
                  <span className="text-primary font-semibold">Max Ceiling: {zar(ADVANCE_CAP)} (80%)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mr-space-2xs">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setPreset(MIN_ADVANCE)}
                  className="px-space-sm py-space-2xs bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-body-sm text-body-sm transition-colors"
                >
                  R 50,000 (Min)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(100000)}
                  className="px-space-sm py-space-2xs bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-body-sm text-body-sm transition-colors"
                >
                  R 100,000 (Half)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(ADVANCE_CAP)}
                  className="px-space-sm py-space-2xs bg-primary-container text-on-primary rounded font-body-sm text-body-sm font-semibold shadow-sm transition-colors"
                >
                  R 148,000 (Max 80%)
                </button>
              </div>
            </div>

            {/* Lifecycle timeline */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[1.25rem]">schedule</span>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                    Lifecycle &amp; Settlement Protocol
                  </span>
                </div>
                <span className="font-label-caps text-label-caps text-tertiary bg-surface-container-low px-space-xs py-space-3xs rounded-full">
                  OFF-BALANCE-SHEET SALE
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="flex flex-col p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-caps text-label-caps bg-primary-container text-on-primary px-space-xs py-space-3xs rounded font-bold">
                      STEP 01
                    </span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant font-semibold">
                      TODAY
                    </span>
                  </div>
                  <span className="font-body-md text-body-md font-semibold text-on-surface mb-space-3xs">
                    Instant Cash Advance
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    <strong className="text-tertiary font-mono-data-cell">{zar(net)}</strong> transferred to ABC
                    Construction&apos;s Absa commercial account within 2 hours of digital execution.
                  </p>
                </div>
                <div className="flex flex-col p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-caps text-label-caps bg-surface-container text-on-surface px-space-xs py-space-3xs rounded font-bold">
                      STEP 02
                    </span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant font-semibold">
                      DAY 60
                    </span>
                  </div>
                  <span className="font-body-md text-body-md font-semibold text-on-surface mb-space-3xs">
                    Debtor Remittance
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Enterprise buyer XYZ Corporation deposits{" "}
                    <strong className="text-on-surface font-mono-data-cell">{zar(GROSS_VALUE)}</strong> gross
                    invoice amount directly into the AbsaFlow Escrow account.
                  </p>
                </div>
                <div className="flex flex-col p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-caps text-label-caps bg-surface-container text-on-surface px-space-xs py-space-3xs rounded font-bold">
                      STEP 03
                    </span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant font-semibold">
                      DAY 61
                    </span>
                  </div>
                  <span className="font-body-md text-body-md font-semibold text-on-surface mb-space-3xs">
                    Rebate Release
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Remaining reserve balance of{" "}
                    <strong className="text-on-surface font-mono-data-cell">{zar(rebate)}</strong> automatically
                    swept to you. Zero residual liability or recourse.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4-cols: execution terminal */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col gap-space-md sticky top-20">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                  Ready for Disbursal
                </span>
                <span className="flex items-center gap-space-3xs font-mono-data-cell text-mono-data-cell text-tertiary font-bold">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span> SYSTEM READY
                </span>
              </div>

              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs">
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Destination Bank:</span>
                  <span className="font-semibold text-on-surface">Absa Corporate SA</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Account Title:</span>
                  <span className="font-semibold text-on-surface truncate max-w-[150px]">
                    ABC Construction (Pty)
                  </span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Branch Code:</span>
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface">
                    632005 (Barclays/Absa)
                  </span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Account No:</span>
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface">•••• •••• 4901</span>
                </div>
              </div>

              <div className="flex flex-col py-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Confirmed Cash-Out Transfer
                </span>
                <span className="font-headline-xl text-headline-xl font-bold text-tertiary tracking-tight">
                  {zar(net)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Real-Time Clearing (RTC) Enabled
                </span>
              </div>

              <button
                type="button"
                disabled={!accepted || disbursed}
                onClick={handleDisburse()}
                className="w-full bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm py-space-md px-space-md rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all duration-200 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[1.375rem]">bolt</span>
                <span>{disbursed ? "Disbursement Initiated" : "Accept Advance & Disburse"}</span>
              </button>

              <div className="flex items-start gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                <input
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                  id="accept-terms"
                  type="checkbox"
                />
                <label className="cursor-pointer select-none" htmlFor="accept-terms">
                  I agree to the <a className="text-primary underline" href="#">Absa Receivables Purchase Agreement</a>{" "}
                  and irrevocably instruct debtor remittance diversion.
                </label>
              </div>

              <div className="flex flex-col gap-space-2xs pt-space-2xs">
                <button
                  type="button"
                  className="w-full py-space-xs px-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[1rem]">download</span>
                  <span>Download Signed Term Sheet (PDF)</span>
                </button>
              </div>

            </div>

            {/* Growth metric visualizer */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                Working Capital Impact
              </span>
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Cash Conversion Cycle:</span>
                <span className="font-bold text-tertiary">-58 Days Accelerated</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant">
                Historical average: 60-day wait → AbsaFlow: 2 hours
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
