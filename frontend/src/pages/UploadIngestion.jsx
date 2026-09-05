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

  // Handle manual file selection / drop
  async function handleFile(file) {
    if (!file) return;
    setSelectedFileName(file.name);
    startPipeline(file, file.name);
  }

  // Orchestrate the real AWS pipeline
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
          setStageResults((prev) => ({
            ...prev,
            [stageIdx]: stageData,
          }));
        },
      });

      setProcessedResult(result);
      setPipelineComplete(true);

      // Register newly created invoice, buyer, and SME in dashboard state
      if (onUploadInvoice) {
        onUploadInvoice(result.invoice, result.buyer, result.sme);
      }
    } catch (err) {
      console.error("AWS pipeline processing failed:", err);
      setPipelineActive(false);
      alert("Error processing invoice in AWS pipeline: " + err.message);
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
    <div className="w-full max-w-[88rem] mx-auto px-gutter-desktop py-space-lg flex flex-col gap-space-lg">
      <div className="w-full flex justify-center items-center">
        <section className="w-full max-w-4xl flex flex-col gap-space-md">

          {/* ===== MAIN INTAKE CARD ===== */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[1.5rem]">cloud_upload</span>
                </div>
                <div>
                  <h2 className="font-title-sm text-title-sm font-bold text-on-surface">
                    Invoice Intake &amp; AWS Pipeline Ingestion
                  </h2>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Upload an invoice PDF to initiate the real AWS pipeline (S3 → Lambda OCR → Policy Verification → Risk Engine → DynamoDB).
                  </p>
                </div>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase bg-surface-container px-space-xs py-space-3xs rounded-full font-bold shrink-0">
                {invoices.length} in DynamoDB
              </span>
            </div>

            {/* Drop Zone */}
            {!pipelineActive && (
              <div
                className={`border-2 border-dashed rounded-xl py-space-2xl px-space-md flex flex-col items-center text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-outline-variant hover:border-primary hover:bg-primary/5"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-space-sm shadow-sm">
                  <span className="material-symbols-outlined text-[3rem]">upload_file</span>
                </div>
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-space-3xs">
                  Select or Drag &amp; Drop Invoice PDF
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
                  Upload an invoice in PDF format to upload to Amazon S3 and execute the end-to-end AWS processing pipeline.
                </p>
                <div className="flex items-center gap-space-sm flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-space-lg py-space-sm bg-primary-container text-on-primary rounded-lg font-body-sm text-body-sm font-bold hover:bg-primary transition-all shadow-md flex items-center gap-space-2xs"
                  >
                    <span className="material-symbols-outlined text-[1.25rem]">add_circle</span>
                    <span>Browse PDF File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    accept=".pdf"
                    className="hidden"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
              </div>
            )}

            {/* ===== AUTOMATED AWS PIPELINE STEPPER ===== */}
            {pipelineActive && (
              <div className="flex flex-col gap-space-md py-space-xs">
                {/* Active file pill */}
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[1.75rem]">picture_as_pdf</span>
                    <div>
                      <span className="font-body-sm font-bold text-on-surface block">{selectedFileName}</span>
                      <span className="text-xs text-on-surface-variant font-mono-data-cell">
                        {pipelineComplete ? "AWS Pipeline execution succeeded • State synced to DynamoDB" : "Connecting to AWS API Gateway & executing Lambdas..."}
                      </span>
                    </div>
                  </div>
                  {pipelineComplete ? (
                    <span className="inline-flex items-center gap-space-3xs bg-tertiary-container text-on-tertiary px-space-sm py-space-3xs rounded-full font-label-caps text-xs font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[1rem]">cloud_done</span> AWS Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-space-3xs bg-primary/10 text-primary px-space-sm py-space-3xs rounded-full font-label-caps text-xs font-bold animate-pulse">
                      <span className="material-symbols-outlined text-[1rem] animate-spin">sync</span> In Progress
                    </span>
                  )}
                </div>

                {/* Stepper list */}
                <div className="flex flex-col gap-space-xs bg-surface-container-lowest rounded-xl border border-surface-container p-space-sm">
                  {PIPELINE_STAGES.map((stage, idx) => {
                    const isPassed = idx < currentStageIdx || (pipelineComplete && idx <= currentStageIdx);
                    const isCurrent = idx === currentStageIdx && !pipelineComplete;
                    const result = stageResults[idx];

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-start gap-space-sm p-space-sm rounded-lg transition-all ${
                          isCurrent
                            ? "bg-primary/5 border border-primary/30 shadow-sm"
                            : isPassed
                            ? "bg-surface-container-low/60"
                            : "opacity-40"
                        }`}
                      >
                        {/* Step indicator */}
                        <div className="mt-0.5 shrink-0">
                          {isPassed ? (
                            <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-bold text-xs shadow-sm">
                              <span className="material-symbols-outlined text-[1.125rem]">check</span>
                            </div>
                          ) : isCurrent ? (
                            <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm animate-pulse">
                              <span className="material-symbols-outlined text-[1.125rem] animate-spin">progress_activity</span>
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        {/* Step text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-body-sm font-bold text-on-surface">
                              Stage {idx + 1}: {stage.label}
                            </span>
                            <span className="font-label-caps text-[11px] uppercase text-on-surface-variant">
                              {isPassed ? "Complete" : isCurrent ? "Executing in AWS" : "Queued"}
                            </span>
                          </div>
                          {result?.message && (
                            <p className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                              {result.message}
                            </p>
                          )}
                          {result?.details && (
                            <p className="text-[11px] text-primary font-mono-data-cell mt-0.5 truncate">
                              {result.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ===== RESULT SUMMARY CARD ===== */}
                {pipelineComplete && processedResult && (
                  <div className="p-space-md rounded-xl bg-gradient-to-br from-primary/5 via-surface-container-lowest to-tertiary-container/10 border-2 border-primary/30 shadow-sm flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-2xs">
                        <span className="material-symbols-outlined text-tertiary text-[1.5rem]">verified</span>
                        <span className="font-title-sm text-title-sm font-bold text-on-surface">
                          AWS Pipeline Complete — Pre-Approved Offer Generated
                        </span>
                      </div>
                      <span className="bg-tertiary-container text-on-tertiary px-space-xs py-space-3xs rounded-full font-label-caps text-xs font-bold uppercase">
                        Funded (85% Advance)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-on-surface-variant uppercase font-label-caps">Invoice Number</span>
                        <span className="font-mono-data-cell text-xs font-bold text-on-surface truncate">
                          {processedResult.invoice.fields.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-on-surface-variant uppercase font-label-caps">Debtor (Buyer)</span>
                        <span className="font-body-sm text-xs font-semibold text-on-surface truncate">
                          {processedResult.invoice.buyer}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-on-surface-variant uppercase font-label-caps">Gross Invoice Value</span>
                        <span className="font-mono-currency text-xs font-bold text-on-surface">
                          {zar(processedResult.invoice.fields.amount)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-on-surface-variant uppercase font-label-caps">Net SME Payout</span>
                        <span className="font-mono-currency text-xs font-bold text-tertiary">
                          {zar(processedResult.offer.netToSme)}
                        </span>
                      </div>
                    </div>

                    {/* S3 & DynamoDB verification badges */}
                    {processedResult.s3Key && (
                      <div className="text-[11px] font-mono-data-cell text-on-surface-variant bg-surface-container-low px-space-xs py-space-3xs rounded flex items-center justify-between">
                        <span>S3 Object: <code className="text-primary">{processedResult.s3Key}</code></span>
                        <span className="text-tertiary font-bold">AWS DynamoDB Synced</span>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between flex-wrap gap-space-xs pt-space-2xs">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-space-sm py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs font-semibold transition-all flex items-center gap-space-3xs"
                      >
                        <span className="material-symbols-outlined text-[1rem]">refresh</span>
                        <span>Upload Another</span>
                      </button>

                      <div className="flex items-center gap-space-xs flex-wrap">
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate("risk")}
                            className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs font-bold transition-all flex items-center gap-space-3xs"
                          >
                            <span>Risk Engine</span>
                            <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
                          </button>
                        )}
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate("funding")}
                            className="px-space-md py-space-xs rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-body-sm text-xs font-bold transition-all flex items-center gap-space-3xs"
                          >
                            <span>Instant Offer</span>
                            <span className="material-symbols-outlined text-[1rem]">bolt</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onContinue?.()}
                          className="px-space-lg py-space-xs rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-sm text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-space-xs"
                        >
                          <span>Continue to OCR Review</span>
                          <span className="material-symbols-outlined text-[1.125rem]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
