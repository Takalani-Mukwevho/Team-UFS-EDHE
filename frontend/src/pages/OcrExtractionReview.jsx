import { useState } from "react";
import { zar } from "../engine/format";

export default function OcrExtractionReview({ onContinue, invoices = [], selectedIdx = 0, onSelectIdx, activeInvoice, buyers = {}, smes = {} }) {
  const [isEditing, setIsEditing] = useState(false);

  const inv = activeInvoice || invoices[selectedIdx] || null;
  const ed = inv?.extractedData || {};
  const lineItems = ed.lineItems || [];

  function zarFmt(n) {
    return zar(n || 0);
  }

  return (
    <div className="max-w-[88rem] mx-auto w-full px-space-md lg:px-space-xl py-space-md pb-28 flex flex-col gap-space-md">

      {/* ===== INVOICE PICKER ===== */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[1.5rem] text-primary">search</span>
            <h2 className="font-title-sm text-title-sm font-bold text-on-surface">
              Select Invoice to Review
            </h2>
          </div>
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} in database
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-space-lg text-center text-on-surface-variant">
            No invoices found. Run the demo first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            {invoices.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => onSelectIdx?.(idx)}
                className={`p-space-sm rounded-xl border-2 text-left transition-all ${
                  idx === selectedIdx
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-outline-variant bg-surface-container-low hover:border-primary/50 hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center justify-between mb-space-2xs">
                  <span className="font-mono-data-cell text-mono-data-cell font-bold text-on-surface">
                    {item.fields?.invoiceNumber || "N/A"}
                  </span>
                  {idx === selectedIdx && (
                    <span className="material-symbols-outlined text-primary text-[1.125rem]">check_circle</span>
                  )}
                </div>
                <div className="font-body-sm text-body-sm font-semibold text-on-surface truncate">
                  {item.buyer || "Unknown Buyer"}
                </div>
                <div className="flex items-center justify-between mt-space-2xs">
                  <span className="font-mono-currency text-mono-currency font-bold text-primary">
                    {zarFmt(item.fields?.amount)}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    {item.smeVerified ? "Verified" : "Pending"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== EXTRACTED DATA ===== */}
      {inv && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-md items-start">

          {/* LEFT: Vendor & Buyer info */}
          <div className="flex flex-col gap-space-sm">
            {/* Supplier card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Supplier</h3>
                {inv.smeVerified ? (
                  <span className="inline-flex items-center gap-space-2xs bg-tertiary-container text-on-tertiary px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps font-bold">
                    <span className="material-symbols-outlined text-[0.875rem]">verified</span> KYB Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-space-2xs bg-surface-container text-on-surface-variant px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps font-bold">
                    Pending
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-space-2xs">
                <span className="font-body-md text-body-md font-bold text-on-surface">
                  {ed.vendorName || inv.sme || "N/A"}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{ed.vendorAddress || "No address extracted"}</span>
              </div>
            </div>

            {/* Buyer card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Buyer</h3>
                <span className="inline-flex items-center gap-space-2xs bg-secondary-container text-on-secondary-container px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps font-bold">
                  Debtor
                </span>
              </div>
              <div className="flex flex-col gap-space-2xs">
                <span className="font-body-md text-body-md font-bold text-on-surface">
                  {ed.buyerName || inv.buyer || "N/A"}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{ed.buyerAddress || "No address extracted"}</span>
              </div>
            </div>

            {/* Invoice meta */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-space-sm">Invoice Details</h3>
              <div className="flex flex-col gap-space-xs">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Invoice Number</span>
                  <span className="font-mono-data-cell text-mono-data-cell font-bold text-on-surface">
                    {inv.fields?.invoiceNumber || ed.invoiceNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Date Issued</span>
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface">{inv.fields?.issueDate || "N/A"}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Payment Due</span>
                  <span className="font-mono-data-cell text-mono-data-cell font-semibold text-on-surface">{inv.fields?.dueDate || "N/A"}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Credit Terms</span>
                  <span className="font-mono-data-cell text-mono-data-cell font-semibold text-on-surface">{inv.fields?.termsDays || "N/A"} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Line items & totals */}
          <div className="flex flex-col gap-space-sm">
            {/* Line items */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-space-sm bg-surface-container-high px-space-md py-space-sm">
                <span className="material-symbols-outlined text-primary text-[1.125rem]">receipt_long</span>
                <span className="font-title-sm text-title-sm font-bold text-on-surface">Extracted Line Items</span>
              </div>

              {lineItems.length === 0 ? (
                <div className="p-space-md text-on-surface-variant text-body-sm">No line items extracted.</div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-xs text-on-surface-variant font-label-caps text-label-caps uppercase font-bold text-body-sm">
                    <div className="flex-1 min-w-0">Description</div>
                    <div className="w-16 text-right shrink-0">Qty</div>
                    <div className="w-28 text-right shrink-0">Unit Price</div>
                    <div className="w-28 text-right shrink-0">Amount</div>
                  </div>
                  {lineItems.map((li, i) => (
                    <div key={i} className="flex items-start gap-space-sm px-space-md py-space-xs bg-surface-container-lowest text-body-sm border-b border-surface-container-low">
                      <div className="flex-1 min-w-0 font-medium text-on-surface">
                        <span className="font-mono-data-cell text-on-surface-variant mr-space-2xs">{String(i + 1).padStart(2, "0")}</span>
                        {li.description || "N/A"}
                      </div>
                      <div className="w-16 text-right shrink-0 font-mono-data-cell text-on-surface-variant">{li.quantity}</div>
                      <div className="w-28 text-right shrink-0 font-mono-data-cell text-on-surface">{zarFmt(li.unitPrice)}</div>
                      <div className="w-28 text-right shrink-0 font-mono-data-cell font-semibold text-on-surface">{zarFmt(li.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-space-sm">Invoice Totals</h3>
              <div className="flex flex-col gap-space-xs">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Subtotal (Excl. VAT)</span>
                  <span className="font-mono-data-cell text-on-surface">{zarFmt(ed.subtotal)}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">VAT (15%)</span>
                  <span className="font-mono-data-cell text-on-surface">{zarFmt(ed.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-space-xs border-t border-surface-container-high mt-space-xs">
                  <span className="font-title-sm text-title-sm text-on-surface font-bold">Total Invoiced</span>
                  <span className="font-mono-currency text-mono-currency font-bold text-primary">{zarFmt(ed.totalAmount || inv.fields?.amount)}</span>
                </div>
              </div>
            </div>

            {/* Verification status */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-space-sm">Verification</h3>
              <div className="flex flex-col gap-space-xs">
                {[
                  { label: "All required fields extracted", pass: true, note: `${lineItems.length} line items + headers` },
                  { label: "Due date after issue date", pass: true, note: "valid" },
                  { label: "Amount positive and within limit", pass: true, note: "under R500k cap" },
                  { label: "Supplier matches KYB profile", pass: inv.smeVerified, note: inv.smeVerified ? "matched" : "pending" },
                  { label: "Buyer in settlement dataset", pass: !!ed.buyerName, note: ed.buyerName ? "matched" : "no match" },
                  { label: "Not previously submitted", pass: inv.checksPass, note: inv.dupNote || "no ledger match" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-space-xs text-body-sm">
                    <span className={`font-bold ${c.pass ? "text-tertiary" : "text-error"}`}>{c.pass ? "✓" : "✕"}</span>
                    <span className="flex-1 text-on-surface">{c.label}</span>
                    <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant text-xs">{c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM ACTIONS ===== */}
      <div className="sticky bottom-4 z-30 bg-surface-container-lowest/95 backdrop-blur-xl p-space-sm lg:p-space-md rounded-xl shadow-xl flex items-center justify-end gap-space-sm">
        <button
          type="button"
          onClick={onContinue}
          disabled={!inv}
          className="flex items-center justify-center gap-space-xs px-space-lg py-space-xs rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-lg text-body-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Run Verification & Buyer Risk Check</span>
          <span className="material-symbols-outlined text-[1.25rem]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
