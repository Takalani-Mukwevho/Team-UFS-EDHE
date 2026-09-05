import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    num: "01",
    icon: "upload_file",
    title: "Upload Invoice",
    desc: "Drop your invoice PDF. AWS Textract extracts text from any format.",
  },
  {
    num: "02",
    icon: "smart_toy",
    title: "AI Extraction",
    desc: "AWS Bedrock Claude parses vendor, buyer, line items, amounts, and dates with confidence scores.",
  },
  {
    num: "03",
    icon: "query_stats",
    title: "Risk Assessment",
    desc: "Buyer payment history, SME verification, and invoice integrity scored via our risk engine.",
  },
  {
    num: "04",
    icon: "bolt",
    title: "Get Funded",
    desc: "See your advance offer instantly. Accept and receive cash today — not in 60 days.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col overflow-hidden">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-space-md">
        <div className="flex items-center justify-center gap-space-xs mb-space-md">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[1.5rem] text-on-primary">account_balance</span>
          </div>
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight">AbsaFlow</span>
        </div>

        <h1 className="font-display-xl text-display-xl font-bold tracking-tight text-on-surface mb-space-sm leading-tight text-center">
          Invoice financing,<br />in seconds.
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-space-lg leading-relaxed text-center">
          Upload an invoice. Get AI-powered risk analysis. Access your cash today
          instead of waiting 60 days for payment.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-space-sm mb-space-xl">
          <button
            type="button"
            onClick={() => navigate("/user")}
            className="px-space-lg py-space-sm bg-primary hover:bg-primary/90 text-on-primary font-body-md text-body-md font-bold rounded-lg shadow-md transition-all flex items-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-[1.25rem]">upload_file</span>
            Upload Invoice
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard")}
            className="px-space-lg py-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md text-body-md font-semibold rounded-lg border border-outline-variant transition-all flex items-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-[1.25rem]">receipt_long</span>
            View Invoices
          </button>
        </div>

        {/* How it works — compact horizontal timeline */}
        <div className="flex items-start gap-space-lg max-w-3xl w-full">
          {STEPS.map((step, i) => (
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
