import { useRef, useState } from "react";

export default function UploadIngestion({ onContinue, invoices = [] }) {
  const [filename, setFilename] = useState("invoice-upload.pdf");
  const [progress, setProgress] = useState(100);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function simulateUpload(name) {
    if (!name) return;
    setFilename(name);
    setUploading(true);
    setProgress(20);
    setTimeout(() => setProgress(65), 300);
    setTimeout(() => { setProgress(100); setUploading(false); }, 800);
  }

  return (
    <div className="w-full max-w-[88rem] mx-auto px-gutter-desktop py-space-lg flex flex-col gap-space-lg">
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
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} in database
              </span>
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
                Drop in an invoice from a corporate buyer. PDF, TIFF or JPG, up to 25MB.
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
              </div>
            </div>

            <div className="mt-space-md p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between flex-wrap gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-mono-data-cell font-bold shadow-sm">
                  PDF
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-body-sm text-body-sm font-bold text-on-surface">{filename}</span>
                  <span className="font-mono-data-cell text-mono-data-cell text-secondary">
                    {uploading ? "Uploading..." : "Ready"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-tertiary bg-surface-container-lowest px-space-xs py-space-3xs rounded-full font-bold">
                  {uploading ? "Uploading" : "Validated"}
                </span>
              </div>
            </div>

            {uploading && (
              <div className="mt-space-xs h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onContinue?.()}
            className="w-full flex items-center justify-center gap-space-xs px-space-lg py-space-xs rounded-lg font-body-lg text-body-lg font-bold shadow-sm transition-all bg-primary-container hover:bg-primary text-on-primary hover:shadow-md"
          >
            <span>Continue to OCR Review</span>
            <span className="material-symbols-outlined text-[1.25rem]">arrow_forward</span>
          </button>
        </section>
      </div>
    </div>
  );
}
