import { useState } from "react";
import Header from "../components/Header";
import UploadIngestion from "./UploadIngestion";
import OcrExtractionReview from "./OcrExtractionReview";
import BuyerRiskEngine from "./BuyerRiskEngine";
import InstantFundingOffer from "./InstantFundingOffer";

const PAGES = {
  upload: UploadIngestion,
  ocr: OcrExtractionReview,
  risk: BuyerRiskEngine,
  funding: InstantFundingOffer,
};

const ORDER = ["upload", "ocr", "risk", "funding"];

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("upload");
  const [runKey, setRunKey] = useState(0); // force-reset child state on "Reset"

  const ActivePage = PAGES[activeTab];

  function goTo(tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setActiveTab("upload");
    setRunKey((k) => k + 1);
  }

  // Header is the only navigation and is fixed at 64px tall, so the content
  // needs vertical clearance only. No sidebar, no horizontal offset.
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <Header active={activeTab} onNavigate={goTo} onReset={handleReset} />
      <main className="w-full pt-16 min-h-screen">
        <ActivePage
          key={`${activeTab}-${runKey}`}
          onContinue={() => {
            const next = ORDER[ORDER.indexOf(activeTab) + 1];
            if (next) goTo(next);
          }}
        />
      </main>
    </div>
  );
}
