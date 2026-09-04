import { useState } from "react";

const CONFIDENCE_FIELDS = [
  { id: "field-inv-no", label: "Field 01 • Invoice Identifier", icon: "tag", value: "INV-1042", badge: "99.4% AI Confidence", mono: true },
  { id: "field-supplier", label: "Field 02 • Supplier Entity (Issuer)", icon: "apartment", value: "ABC Construction (Pty) Ltd", badge: "Verified KYB", note: "CIPC Registration: 2018/492011/07", note2: "B-BBEE Level 2 Contributor" },
  { id: "field-buyer", label: "Field 03 • Enterprise Buyer / Debtor Obligor", icon: "domain_verification", value: "XYZ Corporation Ltd", badge: "Absa Corporate Registry Match", note: "Absa Corporate Tier: Tier 1 Blue-Chip", note2: "Credit Line: R 45.0M Active" },
];

export default function OcrExtractionReview({ onContinue }) {
  const [isEditing, setIsEditing] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const [rescanning, setRescanning] = useState(false);

  function highlightField(id) {
    setHighlighted(id);
    setTimeout(() => setHighlighted((cur) => (cur === id ? null : cur)), 2000);
  }

  function triggerRescan() {
    setRescanning(true);
    setTimeout(() => setRescanning(false), 1200);
  }

  const inputBase =
    "w-full pl-10 pr-space-md py-space-xs font-body-md text-body-md font-medium rounded-lg border-0 focus:outline-none transition-all";
  const inputState = isEditing
    ? "bg-surface-container-lowest ring-1 ring-primary"
    : "bg-surface-container-low";

  return (
    <div className="max-w-[88rem] mx-auto w-full px-space-md lg:px-space-xl py-space-md pb-28 flex flex-col gap-space-md">
      {/* Progress Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
        <div className="flex items-center gap-space-xs">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary text-label-caps font-label-caps">
            2
          </span>
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block">
              Stage 2 of 5
            </span>
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              OCR &amp; Extraction Review
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-space-2xs text-body-sm font-body-sm">
          <span className="flex items-center gap-space-3xs text-tertiary font-semibold">
            <span className="material-symbols-outlined text-[1rem]">check_circle</span> 1. Ingestion
          </span>
          <span className="text-on-surface-variant/40 px-space-3xs">→</span>
          <span className="flex items-center gap-space-3xs text-primary font-bold bg-primary/10 px-space-xs py-space-3xs rounded-full">
            <span className="material-symbols-outlined text-[1rem]">document_scanner</span> 2. Document AI Review
          </span>
          <span className="text-on-surface-variant/40 px-space-3xs">→</span>
          <span className="text-on-surface-variant/60">3. Buyer Verification</span>
          <span className="text-on-surface-variant/40 px-space-3xs">→</span>
          <span className="text-on-surface-variant/60">4. Settlement</span>
          <span className="text-on-surface-variant/40 px-space-3xs">→</span>
          <span className="text-on-surface-variant/60">5. Audit Ledger</span>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant bg-surface-container px-space-xs py-space-3xs rounded-lg">
            Batch #ZA-2026-884
          </span>
          <span className="inline-flex items-center gap-space-3xs bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Engine Online
          </span>
        </div>
      </div>

      {/* Notification banner */}
      <div className="bg-surface-container-high rounded-xl p-space-sm shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary"></div>
        <div className="flex items-center gap-space-sm pl-space-xs">
          <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[1.5rem]">task_alt</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs flex-wrap">
              <h1 className="font-title-sm text-title-sm text-on-surface font-semibold">
                Document OCR Extraction Complete
              </h1>
              <span className="font-mono-data-cell text-mono-data-cell text-tertiary font-bold bg-surface-container-lowest px-space-xs py-space-3xs rounded-full shadow-sm">
                98.7% Model Score
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
              AWS Textract Document Analysis processed 14 fields across single payload.
              Cross-verified with SARS eFiling structure &amp; PO registry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-xs self-end md:self-center shrink-0">
          <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant">Latency: 840ms</span>
          <button
            type="button"
            className="flex items-center gap-space-3xs px-space-sm py-space-2xs rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-body-sm text-body-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[1rem]">download</span>
            <span>Raw JSON</span>
          </button>
        </div>
      </div>

      {/* Split screen: document viewer + editable form */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        {/* LEFT: interactive document viewer */}
        <div className="xl:col-span-7 flex flex-col gap-space-xs min-w-0">
          <div className="bg-surface-container-lowest rounded-xl p-space-xs shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[1.25rem]">picture_as_pdf</span>
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                INV-1042_ABC_Const.pdf
              </span>
              <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant bg-surface-container px-space-2xs py-space-3xs rounded">
                1.2 MB
              </span>
            </div>
            <div className="flex items-center gap-space-2xs">
              <button type="button" className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[1rem]">zoom_out</span>
              </button>
              <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant px-space-2xs">100%</span>
              <button type="button" className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[1rem]">zoom_in</span>
              </button>
              <button type="button" className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface ml-space-2xs">
                <span className="material-symbols-outlined text-[1rem]">fullscreen</span>
              </button>
            </div>
          </div>

          <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-md lg:p-space-lg overflow-hidden select-none">
            <div className="absolute right-4 top-4 text-surface-container font-headline-xl font-bold opacity-30 pointer-events-none hidden xl:block">
              ABSA AI OCR
            </div>
            <div className="flex flex-col gap-space-md">
              <div className="flex justify-between items-start bg-surface-container-low p-space-sm rounded-lg">
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-title-sm text-title-sm text-on-surface font-bold">
                      ABC Construction (Pty) Ltd
                    </span>
                    <span className="material-symbols-outlined text-tertiary text-[1rem]" title="CIPC Registered">
                      verified
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Reg: 2018/492011/07 • VAT: 4820193482
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    12 Katherine Street, Sandton, Johannesburg, 2196
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    accounts@abcconstruction.co.za | +27 11 892 0100
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight block">
                    TAX INVOICE
                  </span>
                  <div
                    className="relative inline-block mt-space-2xs cursor-pointer"
                    onClick={() => highlightField("field-inv-no")}
                  >
                    <div className="absolute -inset-1 bg-tertiary-container/15 rounded ring-2 ring-tertiary-container shadow-[0_0_8px_rgba(0,125,85,0.4)] animate-pulse"></div>
                    <div className="relative bg-surface-container-lowest px-space-xs py-space-3xs rounded z-10 flex items-center gap-space-2xs">
                      <span className="font-mono-data-cell text-mono-data-cell text-on-surface font-bold">
                        INV-1042
                      </span>
                      <span className="font-mono-data-cell text-[0.625rem] bg-tertiary-container text-on-tertiary font-bold px-1 py-0.5 rounded leading-none">
                        99.4%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
                <div className="bg-surface-container-low/60 p-space-xs rounded-lg flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold mb-space-3xs">
                    BILLED TO:
                  </span>
                  <span className="font-body-sm text-body-sm font-bold text-on-surface">XYZ Corporation Ltd</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    140 West Street, Sandton, 2196
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">VAT Reg: 4920182741</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    AP Contact: accounts.payable@xyzcorp.co.za
                  </span>
                </div>
                <div className="bg-surface-container-low/60 p-space-xs rounded-lg flex flex-col justify-between gap-space-2xs">
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant">Date Issued:</span>
                    <span className="font-mono-data-cell text-on-surface font-medium">01/09/2026</span>
                  </div>
                  <div
                    className="flex justify-between items-center text-body-sm cursor-pointer"
                    onClick={() => highlightField("field-due-date")}
                  >
                    <span className="text-on-surface-variant">Payment Due:</span>
                    <div className="flex items-center gap-space-2xs">
                      <span className="font-mono-data-cell text-on-surface font-bold bg-surface-container-lowest px-space-xs py-space-3xs rounded shadow-sm">
                        31/10/2026
                      </span>
                      <span className="font-mono-data-cell text-[0.5625rem] bg-tertiary text-on-tertiary px-1 rounded shrink-0">
                        99.1%
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex justify-between items-center text-body-sm cursor-pointer"
                    onClick={() => highlightField("field-terms")}
                  >
                    <span className="text-on-surface-variant">Credit Terms:</span>
                    <div className="flex items-center gap-space-2xs">
                      <span className="font-mono-data-cell text-on-surface font-bold bg-surface-container-lowest px-space-xs py-space-3xs rounded shadow-sm">
                        60 Days net
                      </span>
                      <span className="font-mono-data-cell text-[0.5625rem] bg-tertiary text-on-tertiary px-1 rounded shrink-0">
                        97.9%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant">PO Reference:</span>
                    <span className="font-mono-data-cell text-on-surface font-semibold text-primary">
                      PO-XYZ-88219
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col bg-surface-container-low rounded-lg overflow-hidden">
                <div className="flex items-center gap-space-sm bg-surface-container-high px-space-sm py-space-xs text-on-surface-variant font-label-caps text-label-caps uppercase font-bold">
                  <div className="flex-1 min-w-0">Description / Scope of Work</div>
                  <div className="w-20 text-right shrink-0">Qty</div>
                  <div className="w-32 text-right shrink-0">Net Amount</div>
                </div>
                <div className="flex items-start gap-space-sm px-space-sm py-space-xs bg-surface-container-lowest text-body-sm border-b border-surface-container-low">
                  <div className="flex-1 min-w-0 font-medium text-on-surface">
                    <span className="font-mono-data-cell text-on-surface-variant mr-space-2xs">01</span>
                    Commercial Foundation Reinforcement - Phase 3
                    <span className="block font-body-sm text-[0.6875rem] text-on-surface-variant">
                      Site: Sandton Tower Extension Project • Milestone Cert #48
                    </span>
                  </div>
                  <div className="w-20 text-right shrink-0 font-mono-data-cell text-on-surface-variant">1.0 Lump</div>
                  <div className="w-32 text-right shrink-0 font-mono-data-cell font-semibold text-on-surface">
                    R 160,869.57
                  </div>
                </div>
                <div className="p-space-sm flex flex-col gap-space-2xs bg-surface-container-low/40">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">Subtotal (Excl. VAT):</span>
                    <span className="font-mono-data-cell text-on-surface">R 160,869.57</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">Standard Rate VAT (15.0%):</span>
                    <span className="font-mono-data-cell text-on-surface">R 24,130.43</span>
                  </div>
                  <div
                    className="flex flex-wrap justify-between items-center gap-space-2xs pt-space-xs border-t border-surface-container-high mt-space-2xs relative cursor-pointer"
                    onClick={() => highlightField("field-gross")}
                  >
                    <div className="absolute -inset-1.5 bg-primary-container/10 rounded-lg ring-2 ring-primary shadow-md"></div>
                    <span className="relative font-title-sm text-title-sm text-on-surface font-bold">
                      Total Invoiced (ZAR):
                    </span>
                    <div className="relative flex items-center gap-space-xs">
                      <span className="font-mono-currency text-mono-currency font-bold text-primary">
                        R 185,000.00
                      </span>
                      <span className="font-mono-data-cell text-[0.625rem] bg-primary text-on-primary font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        99.8% Match
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-space-xs bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-space-xs text-body-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-[1.25rem]">
                    account_balance
                  </span>
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold block">
                      Designated Remittance Bank
                    </span>
                    <span className="font-mono-data-cell text-mono-data-cell font-semibold text-on-surface">
                      Absa Corporate Cheque • Acc: 4082919821
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-2xs bg-surface-container-lowest px-space-xs py-space-3xs rounded text-tertiary font-label-caps text-label-caps font-bold">
                  <span className="material-symbols-outlined text-[0.875rem]">security</span>
                  <span>MATCHES ABSA REPOSITORY</span>
                </div>
              </div>

              <div className="flex items-center gap-space-sm pt-space-2xs text-body-sm text-on-surface-variant flex-wrap">
                <span className="font-label-caps text-label-caps uppercase font-semibold">Bounding Legend:</span>
                <span className="inline-flex items-center gap-1 font-mono-data-cell text-[0.75rem]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-tertiary-container"></span> Green = 99%+
                </span>
                <span className="inline-flex items-center gap-1 font-mono-data-cell text-[0.75rem]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-primary"></span> Red = Primary Target
                </span>
                <span className="inline-flex items-center gap-1 font-mono-data-cell text-[0.75rem] text-on-surface-variant/80">
                  <span className="material-symbols-outlined text-[0.875rem]">touch_app</span> Click box to inspect
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: editable structured fields */}
        <div className="xl:col-span-5 flex flex-col gap-space-sm min-w-0">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Structured Validation Payload
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                Extracted Invoice Data
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className="flex items-center gap-space-2xs px-space-sm py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-body-sm font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[1.125rem]">{isEditing ? "check" : "edit"}</span>
              <span>{isEditing ? "Save Changes" : "Edit Fields"}</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-md">
            {CONFIDENCE_FIELDS.map((f) => (
              <div
                key={f.id}
                className={`flex flex-col gap-space-2xs p-space-xs rounded-lg transition-all duration-300 ${highlighted === f.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
              >
                <div className="flex items-center justify-between">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">
                    {f.label}
                  </label>
                  <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> {f.badge}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-on-surface-variant material-symbols-outlined text-[1.25rem]">
                    {f.icon}
                  </span>
                  <input
                    className={`${inputBase} ${inputState} ${f.mono ? "font-mono-data-cell text-mono-data-cell" : ""}`}
                    readOnly={!isEditing}
                    type="text"
                    defaultValue={f.value}
                  />
                </div>
                {f.note && (
                  <div className="flex flex-wrap items-center justify-between gap-x-space-sm gap-y-space-3xs px-space-xs text-body-sm text-on-surface-variant">
                    <span>{f.note}</span>
                    <span className="text-tertiary font-medium">{f.note2}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Gross amount field */}
            <div
              className={`flex flex-col gap-space-2xs p-space-xs rounded-lg bg-surface-container-low transition-all duration-300 ${highlighted === "field-gross" ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
            >
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">
                  Field 04 • Gross Payable Amount (Incl. VAT)
                </label>
                <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-space-3xs rounded-full font-mono-data-cell text-mono-data-cell font-bold">
                  <span className="material-symbols-outlined text-[0.75rem]">check</span> 99.8% Confirmed
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-0 top-0 bottom-0 px-space-sm bg-surface-container-high text-on-surface font-mono-currency text-mono-currency font-bold rounded-l-lg flex items-center justify-center">
                  ZAR
                </div>
                <input
                  className={`w-full pl-16 pr-space-md py-space-xs text-primary font-mono-currency text-mono-currency font-bold rounded-lg border-0 focus:ring-2 focus:ring-primary focus:outline-none transition-all ${isEditing ? "bg-surface-container-lowest ring-1 ring-primary" : "bg-surface-container-lowest"
                    }`}
                  readOnly={!isEditing}
                  type="text"
                  defaultValue="185,000.00"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-space-sm gap-y-space-3xs px-space-xs text-body-sm text-on-surface-variant">
                <span>Principal: R 160,869.57</span>
                <span>Output VAT (15%): R 24,130.43</span>
              </div>
            </div>

            {/* Dates & terms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
              <div className="flex flex-col gap-space-3xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">
                  Issue Date
                </label>
                <input
                  className="w-full px-space-sm py-space-xs bg-surface-container-low font-mono-data-cell text-mono-data-cell text-on-surface rounded-lg border-0"
                  readOnly
                  type="text"
                  defaultValue="01/09/2026"
                />
              </div>
              <div
                className={`flex flex-col gap-space-3xs rounded-lg transition-all ${highlighted === "field-due-date" ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
              >
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold flex items-center justify-between">
                  <span>Due Date</span>
                  <span className="text-tertiary font-mono-data-cell text-[0.625rem]">99.1%</span>
                </label>
                <input
                  className="w-full px-space-sm py-space-xs bg-surface-container-low font-mono-data-cell text-mono-data-cell text-on-surface font-semibold rounded-lg border-0"
                  readOnly
                  type="text"
                  defaultValue="31/10/2026"
                />
              </div>
              <div
                className={`flex flex-col gap-space-3xs rounded-lg transition-all ${highlighted === "field-terms" ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
              >
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold flex items-center justify-between">
                  <span>Credit Terms</span>
                  <span className="text-tertiary font-mono-data-cell text-[0.625rem]">97.9%</span>
                </label>
                <input
                  className="w-full px-space-sm py-space-xs bg-surface-container-low font-mono-data-cell text-mono-data-cell text-on-surface font-semibold rounded-lg border-0"
                  readOnly
                  type="text"
                  defaultValue="60 Days Net"
                />
              </div>
            </div>

            {/* PO reference */}
            <div className="flex flex-col gap-space-2xs p-space-xs rounded-lg">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">
                  Field 06 • Purchase Order Reference
                </label>
                <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-space-3xs rounded-full font-label-caps text-label-caps font-bold">
                  <span className="material-symbols-outlined text-[0.75rem]">sync</span> Matched to Buyer ERP
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-on-surface-variant material-symbols-outlined text-[1.25rem]">
                  receipt_long
                </span>
                <input
                  className={`${inputBase} ${inputState} font-mono-data-cell text-mono-data-cell`}
                  readOnly={!isEditing}
                  type="text"
                  defaultValue="PO-XYZ-88219"
                />
              </div>
              <div className="flex items-center gap-space-xs px-space-xs text-body-sm text-tertiary font-medium">
                <span className="material-symbols-outlined text-[0.875rem]">verified</span>
                <span>Buyer ERP SAP ECC 6.0 confirmation receipt #SAP-49102-AC</span>
              </div>
            </div>

            {/* Bank details */}
            <div className="flex flex-col gap-space-2xs p-space-xs rounded-lg bg-surface-container-low">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">
                  Field 07 • Disbursement Bank Settlement Target
                </label>
                <span className="font-label-caps text-label-caps text-tertiary font-bold">Absa Direct Connect</span>
              </div>
              <div className="flex items-center justify-between p-space-xs bg-surface-container-lowest rounded-lg">
                <div className="flex items-center gap-space-xs">
                  <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[1.125rem]">account_balance</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-bold text-on-surface">
                      Absa Corporate Business Cheque
                    </span>
                    <span className="font-mono-data-cell text-[0.75rem] text-on-surface-variant">
                      Branch: 632005 • Acc: ****-****-9821
                    </span>
                  </div>
                </div>
                <span className="font-label-caps text-label-caps text-tertiary bg-tertiary-fixed/40 px-space-xs py-space-3xs rounded-full font-bold">
                  BENEFICIARY CONFIRMED
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom action console */}
      <div className="sticky bottom-4 z-30 bg-surface-container-lowest/95 backdrop-blur-xl p-space-sm lg:p-space-md rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-space-sm mt-space-sm">
        <div className="flex items-center gap-space-sm w-full sm:w-auto">
          <button
            type="button"
            onClick={triggerRescan}
            className="w-full sm:w-auto flex items-center justify-center gap-space-2xs px-space-md py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-body-sm font-semibold transition-all"
          >
            <span className={`material-symbols-outlined text-[1.125rem] ${rescanning ? "animate-spin" : ""}`}>
              refresh
            </span>
            <span>Re-scan Document</span>
          </button>
          <button
            type="button"
            className="hidden sm:flex items-center gap-space-2xs px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[1.125rem]">history</span>
            <span>Extraction Logs</span>
          </button>
        </div>
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
          <div className="hidden lg:flex flex-col text-right mr-space-xs">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Ready for Step 3
            </span>
            <span className="font-mono-data-cell text-mono-data-cell text-on-surface font-bold">
              14/14 Fields Verified
            </span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-lg py-space-xs rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-lg text-body-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            <span>Run Verification &amp; Buyer Risk Check</span>
            <span className="material-symbols-outlined text-[1.25rem]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
