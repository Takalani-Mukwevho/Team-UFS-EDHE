import { useEffect, useMemo, useState } from "react";
import { zar } from "../engine/format";
import { POLICY } from "../engine/policy";
import { sendEmailNotification } from "../services/api";

const FEE_RATE = POLICY.feeRate;
const MIN_ADVANCE_PCT = 0.1;

export default function InstantFundingOffer({ onContinue, activeInvoice, activeRisk, activeBuyer, buyers = {}, smes = {} }) {
  const inv = activeInvoice || {};
  const risk = activeRisk;
  const GROSS_VALUE = inv.fields?.amount || 0;
  const advanceRate = risk?.band ? (POLICY[risk.band] ?? 0.5) : 0.5;
  const ADVANCE_CAP = Math.round(GROSS_VALUE * advanceRate);
  const MIN_ADVANCE = Math.min(Math.round(GROSS_VALUE * MIN_ADVANCE_PCT), ADVANCE_CAP);
  const invoiceKey = activeInvoice?.id || activeInvoice?.fields?.invoiceNumber || null;
  const buyerName = inv.buyer || "Unknown Buyer";
  const invoiceNumber = inv.fields?.invoiceNumber || "N/A";
  const smeName = inv.sme || "Unknown SME";

  const [advance, setAdvance] = useState(ADVANCE_CAP);
  const [accepted, setAccepted] = useState(true);
  const [disbursed, setDisbursed] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setAdvance(ADVANCE_CAP);
    setAccepted(true);
    setDisbursed(false);
  }, [invoiceKey, ADVANCE_CAP]);

  const fee = useMemo(() => advance * FEE_RATE, [advance]);
  const net = useMemo(() => advance - fee, [advance, fee]);
  const rebate = useMemo(() => GROSS_VALUE - net, [net]);
  const pct = useMemo(() => ADVANCE_CAP > 0 ? Math.round((advance / ADVANCE_CAP) * 100) : 0, [advance, ADVANCE_CAP]);

  const handleDisburse = async () => {
    setSending(true);
    try {
      await sendEmailNotification({
        subject: `[SHIFA] Disbursement Approved — ${invoiceNumber}`,
        message: `SHIFA Invoice Funding — Disbursement Confirmation\n\nInvoice: ${invoiceNumber}\nSME Supplier: ${smeName}\nBuyer (Debtor): ${buyerName}\nGross Invoice Value: ${zar(GROSS_VALUE)}\nAdvance Amount: ${zar(advance)}\nFee (${(FEE_RATE * 100).toFixed(0)}%): ${zar(fee)}\nNet Disbursement to SME: ${zar(net)}\n\nThe advance has been processed and will be transferred to the SME's Absa commercial account within 2 hours.\nThe buyer (${buyerName}) will be contacted for settlement on ${inv.fields.dueDate}.\n\nSHIFA — Instant Invoice Funding`,
        eventType: "disbursement",
      });
      setDisbursed(true);
    } catch (err) {
      setDisbursed(true);
    } finally {
      setSending(false);
    }
  };

  if (!activeInvoice) {
    return (
      <div className="max-w-xl mx-auto w-full px-space-md py-space-xl text-center">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Your funding offer</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Select an invoice on the OCR Review tab first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-space-md lg:px-space-xl py-space-xl flex flex-col gap-space-lg">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mb-space-xs">
          Your funding offer
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Invoice {invoiceNumber} to {buyerName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-start">
        <div className="flex flex-col gap-space-lg">
          {/* Hero amount */}
          <div className="text-center bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Net cash today</span>
            <div className="flex items-baseline justify-center gap-space-xs mt-space-xs">
              <span className="font-title-sm text-title-sm text-tertiary font-bold">ZAR</span>
              <span className="font-display-xl text-display-xl font-bold text-tertiary tracking-tight">
                {net.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="font-body-xs text-xs text-on-surface-variant mt-space-xs">Direct instant EFT to {smeName}</p>
          </div>

          {/* Breakdown */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
        <div className="flex justify-between text-body-sm font-body-sm py-space-2xs border-b border-surface-container">
          <span className="text-on-surface-variant">Invoice value</span>
          <span className="font-mono-data-cell font-semibold text-on-surface">{zar(GROSS_VALUE)}</span>
        </div>
        <div className="flex justify-between text-body-sm font-body-sm py-space-2xs border-b border-surface-container">
          <span className="text-on-surface-variant">Advance ({Math.round(advanceRate * 100)}%)</span>
          <span className="font-mono-data-cell font-semibold text-on-surface">{zar(advance)}</span>
        </div>
        <div className="flex justify-between text-body-sm font-body-sm py-space-2xs border-b border-surface-container">
          <span className="text-on-surface-variant">Fee ({(FEE_RATE * 100).toFixed(0)}%)</span>
          <span className="font-mono-data-cell font-semibold text-error">-{zar(fee)}</span>
        </div>
        <div className="flex justify-between text-body-sm font-body-sm py-space-2xs font-bold">
          <span className="text-on-surface">Net to you</span>
          <span className="font-mono-data-cell text-tertiary">{zar(net)}</span>
        </div>
          </div>

          {/* Advance slider */}
          {ADVANCE_CAP > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-body-sm font-bold text-on-surface">Adjust advance</span>
                <span className="font-mono-data-cell text-xs font-bold text-primary">{pct}%</span>
              </div>
              <input
                aria-label="Adjust advance amount"
                className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                max={ADVANCE_CAP}
                min={MIN_ADVANCE}
                step={1}
                type="range"
                value={Math.min(Math.max(advance, MIN_ADVANCE), ADVANCE_CAP)}
                onChange={(e) => setAdvance(Math.min(Math.max(Number(e.target.value), MIN_ADVANCE), ADVANCE_CAP))}
              />
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{zar(MIN_ADVANCE)}</span>
                <span className="text-primary font-semibold">{zar(ADVANCE_CAP)}</span>
              </div>
              <div className="flex gap-space-2xs">
                <button type="button" onClick={() => setAdvance(MIN_ADVANCE)} className="flex-1 py-space-2xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold transition-colors">Min</button>
                <button type="button" onClick={() => setAdvance(Math.round(ADVANCE_CAP * 0.5))} className="flex-1 py-space-2xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold transition-colors">50%</button>
                <button type="button" onClick={() => setAdvance(ADVANCE_CAP)} className="flex-1 py-space-2xs bg-primary-container text-on-primary rounded text-xs font-bold shadow-sm transition-colors">Max</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-lg">
          {/* Timeline */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <span className="font-body-sm font-bold text-on-surface">How it works</span>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-start gap-space-sm">
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[0.625rem] font-bold shrink-0">1</div>
                <div>
                  <span className="font-body-sm font-bold text-on-surface text-sm">Today — Cash advance</span>
                  <p className="text-xs text-on-surface-variant">{zar(net)} transferred to {smeName} within 2 hours.</p>
                </div>
              </div>
              <div className="flex items-start gap-space-sm">
                <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[0.625rem] font-bold shrink-0">2</div>
                <div>
                  <span className="font-body-sm font-bold text-on-surface text-sm">Day {inv.fields?.termsDays || 60} — Buyer pays</span>
                  <p className="text-xs text-on-surface-variant">{buyerName} deposits {zar(GROSS_VALUE)} into SHIFA escrow.</p>
                </div>
              </div>
              <div className="flex items-start gap-space-sm">
                <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[0.625rem] font-bold shrink-0">3</div>
                <div>
                  <span className="font-body-sm font-bold text-on-surface text-sm">Day {(inv.fields?.termsDays || 60) + 1} — Rebate released</span>
                  <p className="text-xs text-on-surface-variant">Remaining {zar(rebate)} swept to you. Zero residual liability.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disburse button */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Invoice: {invoiceNumber}</span>
              <span className="flex items-center gap-space-2xs">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                Ready
              </span>
            </div>
            <button
              type="button"
              disabled={!accepted || disbursed}
              onClick={handleDisburse}
              className="w-full bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm py-space-md rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[1.25rem]">bolt</span>
              <span>{sending ? "Sending..." : disbursed ? "Disbursed" : "Accept & Disburse"}</span>
            </button>
            <label className="flex items-start gap-space-2xs text-xs text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span>I agree to the Absa Receivables Purchase Agreement and authorise collection from {buyerName} on the due date.</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
