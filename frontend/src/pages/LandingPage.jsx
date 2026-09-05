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
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-space-md pt-20 pb-16 text-center">
        <div className="flex items-center justify-center gap-space-xs mb-space-md">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[1.5rem] text-on-primary">account_balance</span>
          </div>
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight">AbsaFlow</span>
        </div>

        <h1 className="font-display-xl text-display-xl font-bold tracking-tight text-on-surface mb-space-sm leading-tight">
          Invoice financing,<br />in seconds.
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-space-lg leading-relaxed">
          Upload an invoice. Get AI-powered risk analysis. Access your cash today
          instead of waiting 60 days for payment.
        </p>


      </div>

      {/* How it works — vertical timeline */}
      <div className="max-w-2xl mx-auto px-space-md pb-24">
        <h2 className="font-title-sm text-title-sm font-bold text-on-surface-variant uppercase tracking-wider text-center mb-space-lg">
          How it works
        </h2>

        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-outline-variant"></div>

          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex gap-space-md py-space-md">
              {/* Step circle */}
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest border-2 border-outline-variant shrink-0">
                <span className="material-symbols-outlined text-[1.25rem] text-primary">{step.icon}</span>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-space-2xs pt-space-2xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-mono-data-cell text-mono-data-cell text-on-surface-variant text-xs">{step.num}</span>
                  <h3 className="font-title-sm text-title-sm font-bold text-on-surface">{step.title}</h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed max-w-md">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at bottom */}
        <div className="text-center mt-space-lg">
          <button
            type="button"
            onClick={() => navigate("/user")}
            className="px-space-xl py-space-sm bg-primary hover:bg-primary/90 text-on-primary font-body-md text-body-md font-bold rounded-lg shadow-md transition-all"
          >
            Try it now
          </button>
          <p className="font-body-xs text-xs text-on-surface-variant mt-space-xs">
            Built for EDHE x Absa Hackathon
          </p>
        </div>
      </div>
    </div>
  );
}
