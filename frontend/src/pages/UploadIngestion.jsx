import { useRef, useState } from "react";
import { PIPELINE_STAGES, runInvoicePipeline } from "../services/pipelineOrchestrator";
import { zar } from "../engine/format";

export default function UploadIngestion({
  onContinue,
  onUploadInvoice,
  onNavigate,
  invoices = [],
  buyers = {},
  smes = {},
}) {
  const [dragOver, setDragOver] = useState(false);
  const [pipelineActive, setPipelineActive] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageResults, setStageResults] = useState({});
  const [processedResult, setProcessedResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setSelectedFileName(file.name);
    startPipeline(file, file.name);
  }

  async function startPipeline(file, fileName) {
    setPipelineActive(true);
    setPipelineComplete(false);
    setCurrentStageIdx(0);
    setStageResults({});
    setProcessedResult(null);

    try {
      const result = await runInvoicePipeline(file, {
        fileName,
        existingInvoices: invoices,
        buyers,
        smes,
        onProgress: (stageIdx, stageData) => {
          setCurrentStageIdx(stageIdx);
          setStageResults((prev) => ({ ...prev, [stageIdx]: stageData }));
        },
      });

      setProcessedResult(result);
      setPipelineComplete(true);
      if (onUploadInvoice) onUploadInvoice(result.invoice, result.buyer, result.sme);
    } catch (err) {
      console.error("Pipeline failed:", err);
      setPipelineActive(false);
      alert("Error processing invoice: " + err.message);
    }
  }

  function handleReset() {
    setPipelineActive(false);
    setPipelineComplete(false);
    setCurrentStageIdx(0);
    setStageResults({});
    setProcessedResult(null);
    setSelectedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="h-full bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
      {/* Centered upload area */}
      <div className="flex-1 flex flex-col items-center justify-center px-space-md py-space-lg">
        {!pipelineActive && (
          <div className="w-full max-w-xl flex flex-col items-center text-center">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[1.5rem] text-on-primary">account_balance</span>
            </div>

            <h1 className="font-display-lg text-display-lg font-bold tracking-tight text-on-surface mb-space-xs">
              Upload an invoice
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
              See how much working capital you could unlock today.
            </p>

            {/* Drop zone */}
            <div
              className={`w-full border-2 border-dashed rounded-xl py-space-2xl px-space-md flex flex-col items-center text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/10 scale-[0.98]"
                  : "border-outline-variant hover:border-primary hover:bg-primary/5"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-space-sm">
                <span className="material-symbols-outlined text-[2.5rem]">upload_file</span>
              </div>
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-space-2xs">
                Drop your invoice here
              </h3>
              <p className="font-body-sm text-sm text-on-surface-variant mb-space-md">
                PDF, PNG or JPG
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-space-lg py-space-sm bg-primary-container text-on-primary rounded-lg font-body-sm text-body-sm font-bold hover:bg-primary transition-all shadow-md"
              >
                Browse files
              </button>
              <input
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                type="file"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
              />
            </div>

            <p className="font-body-xs text-xs text-on-surface-variant mt-space-sm">
              Your document is encrypted and securely processed.
            </p>
          </div>
        )}

        {/* ===== PIPELINE STEPPER ===== */}
        {pipelineActive && (
          <div className="w-full max-w-xl flex flex-col gap-space-md">
            {/* File pill */}
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high">
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="material-symbols-outlined text-primary text-[1.5rem]">picture_as_pdf</span>
                <div className="min-w-0">
                  <span className="font-body-sm font-bold text-on-surface block truncate">{selectedFileName}</span>
                  <span className="text-xs text-on-surface-variant font-mono-data-cell">
                    {pipelineComplete ? "Pipeline complete" : "Processing..."}
                  </span>
                </div>
              </div>
              {pipelineComplete ? (
                <span className="inline-flex items-center gap-space-2xs bg-tertiary-container text-on-tertiary px-space-xs py-space-3xs rounded-full text-xs font-bold shrink-0">
                  <span className="material-symbols-outlined text-[0.875rem]">check</span> Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-space-2xs bg-primary/10 text-primary px-space-xs py-space-3xs rounded-full text-xs font-bold animate-pulse shrink-0">
                  <span className="material-symbols-outlined text-[0.875rem] animate-spin">sync</span> Processing
                </span>
              )}
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-space-2xs">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isPassed = idx < currentStageIdx || (pipelineComplete && idx <= currentStageIdx);
                const isCurrent = idx === currentStageIdx && !pipelineComplete;
                const result = stageResults[idx];

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-space-sm p-space-sm rounded-lg transition-all ${
                      isCurrent ? "bg-primary/5 border border-primary/30" : isPassed ? "bg-surface-container-low/60" : "opacity-30"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isPassed ? (
                        <div className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[0.875rem]">check</span>
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center animate-pulse">
                          <span className="material-symbols-outlined text-[0.875rem] animate-spin">progress_activity</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[0.625rem] font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-body-sm font-bold text-on-surface text-sm">{stage.label}</span>
                      {result?.message && (
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">{result.message}</p>
                      )}
                      {result?.details && (
                        <p className="text-[11px] text-primary font-mono-data-cell mt-0.5 truncate">{result.details}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result card */}
            {pipelineComplete && processedResult && (
              <div className="p-space-md rounded-xl bg-gradient-to-br from-primary/5 via-surface-container-lowest to-tertiary-container/10 border-2 border-primary/30 shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-2xs">
                    <span className="material-symbols-outlined text-tertiary text-[1.25rem]">verified</span>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">Pre-Approved Offer</span>
                  </div>
                  <span className="bg-tertiary-container text-on-tertiary px-space-xs py-space-3xs rounded-full text-xs font-bold uppercase">
                    {Math.round((processedResult.offer?.advanceRate || 0.85) * 100)}% Advance
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-space-xs bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant uppercase font-label-caps">Invoice</span>
                    <span className="font-mono-data-cell text-xs font-bold text-on-surface truncate">
                      {processedResult.invoice.fields.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant uppercase font-label-caps">Buyer</span>
                    <span className="font-body-sm text-xs font-semibold text-on-surface truncate">
                      {processedResult.invoice.buyer}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant uppercase font-label-caps">Invoice Value</span>
                    <span className="font-mono-data-cell text-xs font-bold text-on-surface">
                      {zar(processedResult.invoice.fields.amount)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant uppercase font-label-caps">Net to you</span>
                    <span className="font-mono-data-cell text-xs font-bold text-tertiary">
                      {zar(processedResult.offer.netToSme)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-space-xs pt-space-2xs">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-space-sm py-space-2xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs font-semibold transition-all"
                  >
                    Upload Another
                  </button>
                  <div className="flex items-center gap-space-xs">
                    <button
                      type="button"
                      onClick={() => onContinue?.()}
                      className="px-space-lg py-space-xs rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-sm text-sm font-bold shadow-md transition-all flex items-center gap-space-xs"
                    >
                      <span>Continue to OCR Review</span>
                      <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
