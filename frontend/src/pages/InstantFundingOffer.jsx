import { useMemo, useState } from "react";
import { zar } from "../engine/format";

import { deskDecisionState, disbursementOf } from "../engine/decision";
import { sendEmailNotification, updateInvoiceStatus } from "../services/api";
import { recordSmeAcceptance } from "../services/ledgerBridge";

import { POLICY, ABSA, RULES } from "../engine/policy";
import { evaluateRules, pricingFor, APPROVE, DECLINE } from "../engine/rules";


const MIN_ADVANCE_PCT = 0.3;

export default function InstantFundingOffer({ onContinue, activeInvoice, activeRisk, activeBuyer, buyers = {}, smes = {}, onRefresh, refreshing = false }) {
  if (!activeInvoice) {
    return (
      <div className="max-w-container-max mx-auto w-full px-gutter-desktop py-space-xl">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Your funding offer</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Select an invoice on the OCR Review tab first.</p>
      </div>
    );
  }

  const inv = activeInvoice;
  const risk = activeRisk;
  const flags = inv.flags || {};
  const deskState = flags.deskDecision || deskDecisionState(inv);
  const creditApproved = deskState === 'approved';
  // Paid out once the SME has accepted — either recorded this session or read
  // back from the shared ledger/overlay (so it survives a refresh).
  const paidOut = !!disbursementOf(inv);
  const rules = evaluateRules(inv, activeBuyer, smes[inv.smeId]);
  const pricing = pricingFor(risk?.band, rules.absa);
  const absaApplied = rules.absa.qualifies && pricing.advanceRate > 0;
  const GROSS_VALUE = inv.fields.amount;
  const advanceRate = risk ? pricing.advanceRate : 0.5;
  const FEE_RATE = risk ? pricing.feeRate : POLICY.feeRate;
  const ADVANCE_CAP = Math.round(GROSS_VALUE * advanceRate);
  const MIN_ADVANCE = Math.round(GROSS_VALUE * MIN_ADVANCE_PCT);
  const buyerName = inv.buyer;
  const invoiceNumber = inv.fields.invoiceNumber;

  const [advance, setAdvance] = useState(ADVANCE_CAP);
  const [accepted, setAccepted] = useState(true);
  const [disbursed, setDisbursed] = useState(false);
  const [sending, setSending] = useState(false);

  const paidNow = disbursed || paidOut;

  const fee = useMemo(() => advance * FEE_RATE, [advance, FEE_RATE]);
  const net = useMemo(() => advance - fee, [advance, fee]);
  const rebate = useMemo(() => GROSS_VALUE - net, [net]);
  const pct = useMemo(() => ADVANCE_CAP > 0 ? Math.round((advance / ADVANCE_CAP) * 100) : 0, [advance, ADVANCE_CAP]);

  const handleDisburse = async () => {
    setSending(true);
    const invoiceId = inv.raw?.invoiceId || inv.raw?.invoiceNumber || inv.id || inv.fields?.invoiceNumber;
    const acceptedAt = new Date().toISOString();
    const disbursement = { advance, fee, net, fundingRate: advanceRate, acceptedAt };

    try {
      // Persist the acceptance to the shared ledger (status stays 'Funded' once
      // the desk has approved; the disbursement record is what the bank console
      // picks up as the amount paid against this invoice).
      try {
        await updateInvoiceStatus(invoiceId, 'Funded', null, { disbursement });
      } catch (err) {
        // Backend unreachable — the shared-browser overlay still carries the
        // acceptance so the two screens stay in step.
        console.warn('Ledger persist failed, using shared browser overlay:', err.message);
      }
      recordSmeAcceptance(invoiceId, disbursement);

      await sendEmailNotification({
        subject: `[Shifa] Disbursement Approved — ${invoiceNumber}`,
        message: [
          `Shifa Invoice Funding — Disbursement Confirmation`,
          ``,
          `Invoice: ${invoiceNumber}`,
          `SME Supplier: ${inv.sme}`,
          `Buyer (Debtor): ${buyerName}`,
          `Gross Invoice Value: ${zar(GROSS_VALUE)}`,
          `Advance Amount: ${zar(advance)}`,
          `Fee (${+(FEE_RATE * 100).toFixed(2)}%): ${zar(fee)}`,
          `Net Disbursement to SME: ${zar(net)}`,
          ``,
          `The advance has been processed and will be transferred to the SME\'s Absa commercial account within 2 hours.`,
          `The buyer (${buyerName}) will be contacted for settlement on ${inv.fields.dueDate}.`,
          ``,
          `Shifa — Instant Invoice Funding`,
        ].join('\n'),
        eventType: 'disbursement',
      });
    } catch (err) {
      console.error('Email notification failed:', err);
    } finally {
      setDisbursed(true); // still mark as disbursed for demo
      setSending(false);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="max-w-container-max mx-auto w-full px-gutter-desktop pt-space-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Your funding offer</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Invoice {invoiceNumber} to {buyerName}, {zar(GROSS_VALUE)} due {inv.fields.dueDate}.
        </p>
      </div>

      <div className="max-w-container-max mx-auto w-full px-gutter-desktop py-space-xl flex flex-col gap-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {/* Absa relationship benefit */}
            {absaApplied && (
              <div className="bg-tertiary-container/20 rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-tertiary text-[1.5rem]">workspace_premium</span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold text-on-surface">Absa customer pricing applied</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {rules.absa.months} months of banking history, past the {RULES.absaMinMonths}-month threshold.
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-space-xs shrink-0">
                  <span className="px-space-sm py-space-3xs rounded-full bg-surface-container-lowest font-mono-data-cell text-mono-data-cell text-tertiary font-semibold">
                    {Math.round(pricing.baseRate * 100)}% → {Math.round(pricing.advanceRate * 100)}% advance
                  </span>
                  <span className="px-space-sm py-space-3xs rounded-full bg-surface-container-lowest font-mono-data-cell text-mono-data-cell text-tertiary font-semibold">
                    fee −{+(ABSA.feeDiscount * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {/* 4-box metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-surface-variant"></div>
                <div className="flex items-center justify-between text-on-surface-variant mb-space-sm">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">Gross Invoice Value</span>
                  <span className="material-symbols-outlined text-[1.125rem]">receipt_long</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{zar(GROSS_VALUE)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">Debtor: {buyerName}</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
                <div className="flex items-center justify-between text-on-surface-variant mb-space-sm">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">Advance Rate Ceiling</span>
                  <span className="bg-surface-container-high font-mono-data-cell text-mono-data-cell px-space-xs py-space-3xs rounded text-on-surface font-bold">
                    {(advanceRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{zar(ADVANCE_CAP)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Risk band: {risk?.band || "N/A"}
                    {absaApplied && <span className="text-tertiary"> · +{Math.round(ABSA.advanceUplift * 100)}% Absa uplift</span>}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-outline-variant"></div>
                <div className="flex items-center justify-between text-on-surface-variant mb-space-sm">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">Discount Fee ({+(FEE_RATE * 100).toFixed(2)}%)</span>
                  <span className="material-symbols-outlined text-[1.125rem]">percent</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{zar(fee)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    {absaApplied ? `Discounted from ${+(POLICY.feeRate * 100).toFixed(2)}% standard rate` : "Fixed financing charge"}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-tertiary-container"></div>
                <div className="flex items-center justify-between text-tertiary mb-space-sm">
                  <div className="flex items-center gap-space-2xs">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">Net Cash Available Today</span>
                  </div>
                  <span className="bg-surface-container-low text-tertiary px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps uppercase">Immediate</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-space-2xs">
                    <span className="font-title-sm text-title-sm text-tertiary font-bold">ZAR</span>
                    <span className="font-display-lg text-display-lg text-tertiary font-bold tracking-tight">
                      {net.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">Direct instant EFT to SME account</span>
                </div>
              </div>
            </div>

            {/* Slider */}
            {ADVANCE_CAP > 0 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Select Advance Facility Drawdown</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Adjust your required payout amount.</span>
                  </div>
                  <div className="flex items-center gap-space-2xs self-start sm:self-auto bg-surface-container-low px-space-sm py-space-xs rounded-lg">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Current:</span>
                    <span className="font-mono-data-cell text-mono-data-cell text-primary font-bold">{pct}% DRAWDOWN</span>
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
                    <span>Min: {zar(MIN_ADVANCE)}</span>
                    <span className="text-primary font-semibold">Max: {zar(ADVANCE_CAP)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mr-space-2xs">Presets:</span>
                  <button type="button" onClick={() => setAdvance(MIN_ADVANCE)} className="px-space-sm py-space-2xs bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-body-sm text-body-sm transition-colors">Min</button>
                  <button type="button" onClick={() => setAdvance(Math.round(ADVANCE_CAP * 0.5))} className="px-space-sm py-space-2xs bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-body-sm text-body-sm transition-colors">50%</button>
                  <button type="button" onClick={() => setAdvance(ADVANCE_CAP)} className="px-space-sm py-space-2xs bg-primary-container text-on-primary rounded font-body-sm text-body-sm font-semibold shadow-sm transition-colors">Max ({(advanceRate * 100).toFixed(0)}%)</button>
                </div>
              </div>
            )}

            {/* Lifecycle */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[1.25rem]">schedule</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">Lifecycle & Settlement Protocol</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="flex flex-col p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-caps text-label-caps bg-primary-container text-on-primary px-space-xs py-space-3xs rounded font-bold">STEP 01</span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant font-semibold">TODAY</span>
                  </div>
                  <span className="font-body-md text-body-md font-semibold text-on-surface mb-space-3xs">Instant Cash Advance</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    <strong className="text-tertiary font-mono-data-cell">{zar(net)}</strong> transferred to {inv.sme}&apos;s account within 2 hours.
                  </p>
                </div>
                <div className="flex flex-col p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-caps text-label-caps bg-surface-container text-on-surface px-space-xs py-space-3xs rounded font-bold">STEP 02</span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant font-semibold">DAY {inv.fields.termsDays}</span>
                  </div>
                  <span className="font-body-md text-body-md font-semibold text-on-surface mb-space-3xs">Debtor Remittance</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {buyerName} deposits <strong className="text-on-surface font-mono-data-cell">{zar(GROSS_VALUE)}</strong> into the Shifa Escrow account.
                  </p>
                </div>
                <div className="flex flex-col p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-caps text-label-caps bg-surface-container text-on-surface px-space-xs py-space-3xs rounded font-bold">STEP 03</span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant font-semibold">DAY {inv.fields.termsDays + 1}</span>
                  </div>
                  <span className="font-body-md text-body-md font-semibold text-on-surface mb-space-3xs">Rebate Release</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Remaining <strong className="text-on-surface font-mono-data-cell">{zar(rebate)}</strong> swept to you. Zero residual liability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col gap-space-md sticky top-20">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                  {paidNow ? "Advance Disbursed" : creditApproved ? "Ready for Disbursal" : deskState === "declined" ? "Not Approved" : "Credit Desk Review"}
                </span>
                <span className={`flex items-center gap-space-3xs font-mono-data-cell text-mono-data-cell font-bold ${paidNow ? "text-tertiary" : creditApproved ? "text-tertiary" : deskState === "declined" ? "text-error" : "text-primary"
                  }`}></span>
                <span className={`w-2 h-2 rounded-full animate-pulse ${paidNow ? "bg-tertiary" : creditApproved ? "bg-tertiary" : deskState === "declined" ? "bg-error" : "bg-primary"
                  }`}></span>
                {paidNow ? "PAID TO SME" : creditApproved ? "SYSTEM READY" : deskState === "declined" ? "DECLINED" : "PENDING REVIEW"}
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Ready for Disbursal</span>
                <span className={`flex items-center gap-space-3xs font-mono-data-cell text-mono-data-cell font-bold ${rules.outcome === APPROVE ? "text-tertiary" : rules.outcome === DECLINE ? "text-error" : "text-on-surface"}`}>
                  <span className={`w-2 h-2 rounded-full ${rules.outcome === APPROVE ? "bg-tertiary animate-pulse" : rules.outcome === DECLINE ? "bg-error" : "bg-on-surface-variant"}`}></span>
                  {rules.outcome.toUpperCase()}
                </span>
              </div>
              {
                !creditApproved && (
                  <div className={`rounded-lg p-space-sm flex flex-col gap-space-xs font-body-sm text-body-sm ${deskState === "declined"
                    ? "bg-error-container/60 text-on-error-container"
                    : "bg-primary/5 text-on-surface-variant"
                    }`}>
                    {deskState === "declined" ? (
                      <span>The credit desk did not approve an advance against {invoiceNumber}. No disbursement can be made for this invoice.</span>
                    ) : (
                      <>
                        <span>
                          The funding recommendation for {invoiceNumber} is with the AbsaFlow credit desk. Once the desk
                          accepts it, the advance unlocks automatically on this page (status refreshes every few seconds).
                        </span>
                        {onRefresh && (
                          <button
                            type="button"
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="self-start inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold transition-all hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[1rem]">{refreshing ? "sync" : "refresh"}</span>
                            <span>{refreshing ? "Checking..." : "Check approval status"}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              }
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs">
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">SME Supplier:</span>
                  <span className="font-semibold text-on-surface truncate max-w-[150px]">{inv.sme}</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Buyer (Debtor):</span>
                  <span className="font-semibold text-on-surface truncate max-w-[150px]">{buyerName}</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Invoice:</span>
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface">{invoiceNumber}</span>
                </div>
              </div>
              <div className="flex flex-col py-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  {paidNow ? "Disbursed to your account" : "Confirmed Cash-Out Transfer"}
                </span>
                <span className="font-headline-xl text-headline-xl font-bold text-tertiary tracking-tight">{zar(net)}</span>
                {paidNow && (
                  <span className="font-body-sm text-body-sm text-tertiary mt-space-3xs">
                    Paid on {new Date((disbursementOf(inv)?.acceptedAt) || Date.now()).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })} — reflected on the bank console.
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!creditApproved || !accepted || paidNow || sending}
                onClick={handleDisburse}
                className="w-full bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm py-space-md px-space-md rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all duration-200 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[1.375rem]">bolt</span>
                <span>
                  {sending
                    ? "Sending notification..."
                    : paidNow
                      ? "Disbursement Initiated"
                      : !creditApproved
                        ? deskState === "declined"
                          ? "Advance Not Approved"
                          : "Awaiting Credit Approval"
                        : "Accept Advance & Disburse"}
                </span>
              </button>
              <div className="flex items-start gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                <input checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 rounded text-primary focus:ring-0 accent-primary cursor-pointer" id="accept-terms" type="checkbox" />
                <label className="cursor-pointer select-none" htmlFor="accept-terms">
                  I agree to the <a className="text-primary underline" href="#">Absa Receivables Purchase Agreement</a> and authorise collection from {buyerName} on the due date.
                </label>
              </div>
            </div >
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">Working Capital Impact</span>
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Cash Conversion Cycle:</span>
                <span className="font-bold text-tertiary">-{inv.fields.termsDays} Days Accelerated</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant">
                Historical: {inv.fields.termsDays}-day wait → Shifa: 2 hours
              </span>
            </div>
          </div >
        </div >
      </div >
    </div >
  );
}
