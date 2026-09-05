import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PIPELINE_STAGES, runInvoicePipeline } from "../services/pipelineOrchestrator";
import { zar } from "../engine/format";

const STEPS = [
  { num: "01", icon: "upload_file", title: "Upload Invoice", desc: "Drop your invoice PDF. AWS Textract extracts text from any format." },
  { num: "02", icon: "smart_toy", title: "AI Extraction", desc: "AWS Bedrock Claude parses vendor, buyer, line items, amounts, and dates with confidence scores." },
  { num: "03", icon: "query_stats", title: "Risk Assessment", desc: "Buyer payment history, SME verification, and invoice integrity scored via our risk engine." },
  { num: "04", icon: "bolt", title: "Get Funded", desc: "See your advance offer instantly. Accept and receive cash today — not in 60 days." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [pipelineActive, setPipelineActive] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageResults, setStageResults] = useState({});
  const [processedResult, setProcessedResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFile(file) {
    if (!file) return;
    setSelectedFileName(file.name);
    setPipelineActive(true);
    setPipelineComplete(false);
    setCurrentStageIdx(0);
    setStageResults({});
    setProcessedResult(null);

    try {
      const result = await runInvoicePipeline(file, {
        fileName: file.name,
        onProgress: (stageIdx, stageData) => {
          setCurrentStageIdx(stageIdx);
          setStageResults((prev) => ({ ...prev, [stageIdx]: stageData }));
        },
      });
      setProcessedResult(result);
      setPipelineComplete(true);
    } catch (err) {
      console.error("Pipeline failed:", err);
      setPipelineActive(false);
      alert("Error: " + err.message);
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
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        type="file"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-space-md py-space-xl">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-space-md">
          <span className="material-symbols-outlined text-[1.5rem] text-on-primary">account_balance</span>
        </div>

        <h1 className="font-display-xl text-display-xl font-bold tracking-tight text-on-surface mb-space-md text-center leading-tight">
          Invoice financing,<br />in seconds.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-space-lg text-center leading-relaxed">
          Upload an invoice. Get AI-powered risk analysis. Access your cash today
          instead of waiting 60 days for payment.
        </p>

        {/* Buttons or Pipeline */}
        {!pipelineActive && (
          <div className="flex items-center justify-center gap-space-sm mb-space-xl">
            <button
              type="button"
              onClick={handleUploadClick}
              className="px-space-lg py-space-sm bg-primary hover:bg-primary/90 text-on-primary font-body-md text-body-md font-bold rounded-lg shadow-md transition-all flex items-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[1.25rem]">upload_file</span>
              Upload Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate("/user?tab=ocr")}
              className="px-space-lg py-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md text-body-md font-semibold rounded-lg border border-outline-variant transition-all flex items-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[1.25rem]">receipt_long</span>
              View Invoices
            </button>
          </div>
        )}

        {/* Pipeline stepper */}
        {pipelineActive && (
          <div className="w-full max-w-lg flex flex-col gap-space-md mb-space-xl">
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
                      {result?.message && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{result.message}</p>}
                      {result?.details && <p className="text-[11px] text-primary font-mono-data-cell mt-0.5 truncate">{result.details}</p>}
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
                      onClick={() => navigate("/user?tab=ocr")}
                      className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs font-bold transition-all flex items-center gap-space-2xs"
                    >
                      View Invoices
                      <span className="material-symbols-outlined text-[0.875rem]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it works — only when idle */}
        {!pipelineActive && (
          <div className="flex items-start gap-space-lg max-w-3xl w-full">
            {STEPS.map((step) => (
              <div key={step.num} className="flex-1 flex flex-col items-center text-center gap-space-2xs">
                <div className="w-9 h-9 rounded-full bg-surface-container-lowest border-2 border-outline-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[1rem] text-primary">{step.icon}</span>
                </div>
                <div className="flex items-center gap-space-2xs">
                  <span className="font-mono-data-cell text-on-surface-variant text-[10px]">{step.num}</span>
                  <span className="font-body-sm text-body-sm font-bold text-on-surface">{step.title}</span>
                </div>
                <p className="font-body-xs text-xs text-on-surface-variant leading-snug max-w-[12rem]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-space-md">
        <p className="font-body-xs text-xs text-on-surface-variant">
          Built for EDHE x Absa Hackathon
        </p>
      </div>
    </div>
  );
}
