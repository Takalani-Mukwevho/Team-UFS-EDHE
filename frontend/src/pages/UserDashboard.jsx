import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import UploadIngestion from "./UploadIngestion";
import OcrExtractionReview from "./OcrExtractionReview";
import BuyerRiskEngine from "./BuyerRiskEngine";
import InstantFundingOffer from "./InstantFundingOffer";
// import RiskExceptions from "./pages/RiskExceptions";

const PAGES = {
  upload: UploadIngestion,
  ocr: OcrExtractionReview,
  risk: BuyerRiskEngine,
  funding: InstantFundingOffer,
  // exceptions: RiskExceptions,
};

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("upload");
  const [runKey, setRunKey] = useState(0); // used to force-reset child state on "Demo Reset"

  const ActivePage = PAGES[activeTab];

  function goTo(tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setActiveTab("upload");
    setRunKey((k) => k + 1);
  }

  return (
    <div>
      <Header />

      <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
        <Sidebar active={activeTab} onNavigate={goTo} onReset={handleReset} />
        <div className="pl-64">
          <Header active={activeTab} onNavigate={goTo} />
          <main className="w-full pt-16 bg-surface min-h-screen">
            <ActivePage
              key={`${activeTab}-${runKey}`}
              onContinue={() => {
                const order = ["upload", "ocr", "risk", "funding"];
                const next = order[order.indexOf(activeTab) + 1];
                if (next) goTo(next);
              }}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
