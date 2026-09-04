import { useRef, useState } from "react";
import { SCENARIOS, zar } from "../data/scenarios";

const CARD_META = {
  A: { accent: "bg-primary-container", badge: "bg-surface-container-low text-tertiary", dot: "bg-tertiary", cta: "bg-primary-container text-on-primary hover:bg-primary", ctaLabel: "Selected" },
  B: { accent: "bg-secondary-fixed", badge: "bg-secondary-fixed text-on-secondary-fixed-variant", dot: "bg-secondary", cta: "bg-surface-container text-on-surface hover:bg-surface-container-high", ctaLabel: "Test Scenario B →" },
  C: { accent: "bg-error", badge: "bg-error-container text-error", dot: "bg-error", cta: "bg-error text-on-error hover:bg-primary", ctaLabel: "Test Duplicate Rule →" },
};

export default function UploadIngestion({ onContinue }) {
  const [scenario, setScenario] = useState("A");
  const [progress, setProgress] = useState(100);
  const [filename, setFilename] = useState(SCENARIOS.A.filename);
  const fileInputRef = useRef(null);

  const data = SCENARIOS[scenario];

  function switchScenario(key) {
    setScenario(key);
    setFilename(SCENARIOS[key].filename);
    setProgress(100);
  }

  function simulateUpload(name) {
    if (!name) return;
    setFilename(name);
    setProgress(20);
    setTimeout(() => setProgress(65), 300);
    setTimeout(() => setProgress(100), 800);
  }

  return (
    <div className="w-full max-w-[88rem] mx-auto px-gutter-desktop py-space-lg flex flex-col gap-space-lg">
      {/* Centered Upload Container */}
      <div className="w-full flex justify-center items-center">
        <section className="w-full max-w-3xl flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[1.5rem] text-primary">cloud_upload</span>
                <h2 className="font-title-sm text-title-sm font-bold text-on-surface">
                  Invoice &amp; PO Intake Portal
                </h2>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-outline-variant rounded-xl py-space-2xl px-space-md flex flex-col items-center text-center hover:border-primary hover:bg-primary/5 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                simulateUpload(e.dataTransfer.files?.[0]?.name);
              }}
            >
              <span className="material-symbols-outlined text-[2.5rem] text-primary mb-space-xs">description</span>
              <p className="font-body-md text-body-md text-secondary max-w-md mb-space-md">
                Upload verified tax invoices or purchase orders from enterprise buyers (30–90 day
                terms). Supported formats: PDF, TIFF, JPG up to 25MB.
              </p>
              <div className="flex items-center gap-space-sm flex-wrap justify-center">
                <label className="px-space-md py-space-xs bg-primary-container text-on-primary rounded-lg font-body-sm text-body-sm font-bold hover:bg-primary transition-all cursor-pointer shadow-sm flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-[1rem]">add_circle</span>
                  <span>Browse Local Files</span>
                  <input
                    ref={fileInputRef}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    type="file"
                    onChange={(e) => simulateUpload(e.target.files?.[0]?.name)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => switchScenario("A")}
                  className="px-space-md py-space-xs bg-surface-container-lowest text-on-surface rounded-lg font-body-sm text-body-sm font-semibold hover:bg-surface-container transition-colors shadow-sm flex items-center gap-space-2xs"
                >
                  <span className="material-symbols-outlined text-[1rem] text-primary">description</span>
                  <span>Load Sample Tax Invoice (PDF)</span>
                </button>
              </div>
              <div className="mt-space-md flex items-center gap-space-md text-on-surface-variant font-mono-data-cell text-mono-data-cell flex-wrap justify-center">
                <span className="flex items-center gap-space-3xs">
                  <span className="material-symbols-outlined text-[0.875rem] text-tertiary">check_circle</span> SARS
                  Compliant
                </span>
                <span className="flex items-center gap-space-3xs">
                  <span className="material-symbols-outlined text-[0.875rem] text-tertiary">check_circle</span> PO
                  Cross-Match
                </span>
                <span className="flex items-center gap-space-3xs">
                  <span className="material-symbols-outlined text-[0.875rem] text-tertiary">check_circle</span>{" "}
                  Zero-Knowledge KYC
                </span>
              </div>
            </div>

            {/* Active file indicator */}
            <div className="mt-space-md p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between flex-wrap gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-mono-data-cell font-bold shadow-sm">
                  PDF
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-body-sm text-body-sm font-bold text-on-surface">{filename}</span>
                  <span className="font-mono-data-cell text-mono-data-cell text-secondary">
                    3.4 MB • SHA256: 7f8a9...b4012
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-tertiary bg-surface-container-lowest px-space-xs py-space-3xs rounded-full font-bold">
                  ✓ Validated Hash
                </span>
                <button type="button" className="p-space-3xs text-secondary hover:text-on-surface rounded">
                  <span className="material-symbols-outlined text-[1.25rem]">visibility</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onContinue?.(scenario)}
            disabled={data.blocked}
            className={`w-full flex items-center justify-center gap-space-xs px-space-lg py-space-xs rounded-lg font-body-lg text-body-lg font-bold shadow-sm transition-all ${data.blocked
                ? "bg-surface-container text-on-surface-variant cursor-not-allowed"
                : "bg-primary-container hover:bg-primary text-on-primary hover:shadow-md"
              }`}
          >
            <span>{data.blocked ? "Blocked — Cannot Continue" : "Continue to OCR Review"}</span>
            {!data.blocked && <span className="material-symbols-outlined text-[1.25rem]">arrow_forward</span>}
          </button>
        </section>
      </div>
    </div>
  );
}