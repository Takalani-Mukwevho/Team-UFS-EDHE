import { useState, useMemo } from "react";
import Header from "../components/Header";
import UploadIngestion from "./UploadIngestion";
import OcrExtractionReview from "./OcrExtractionReview";
import BuyerRiskEngine from "./BuyerRiskEngine";
import InstantFundingOffer from "./InstantFundingOffer";
import { useApiData } from "../services/useApiData";
import { scoreCase } from "../engine/scoring";

const PAGES = {
  upload: UploadIngestion,
  ocr: OcrExtractionReview,
  risk: BuyerRiskEngine,
  funding: InstantFundingOffer,
};

const ORDER = ["upload", "ocr", "risk", "funding"];

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedInvoiceIdx, setSelectedInvoiceIdx] = useState(0);
  const [liveMode, setLiveMode] = useState(true);
  const { invoices, buyers, smes, loading, dataSource } = useApiData({ useMockFallback: !liveMode });

  // Reversed so sme-002 comes first
  const reversedInvoices = useMemo(() => invoices.slice().reverse(), [invoices]);

  // The selected invoice
  const activeInvoice = reversedInvoices[selectedInvoiceIdx] || reversedInvoices[0] || null;

  // Compute risk for the active invoice
  const activeRisk = useMemo(() => {
    if (!activeInvoice) return null;
    return scoreCase(activeInvoice, buyers);
  }, [activeInvoice, buyers]);

  // Get the buyer data for the active invoice
  const activeBuyer = activeInvoice ? buyers[activeInvoice.buyer] : null;

  const ActivePage = PAGES[activeTab];

  function goTo(tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setActiveTab("upload");
    setSelectedInvoiceIdx(0);
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <Header active={activeTab} onNavigate={goTo} onReset={handleReset} liveMode={liveMode} onToggleLive={() => setLiveMode(v => !v)} />
      <main className="w-full pt-16 min-h-screen">
        <ActivePage
          key={activeTab}
          onContinue={() => {
            const next = ORDER[ORDER.indexOf(activeTab) + 1];
            if (next) goTo(next);
          }}
          invoices={reversedInvoices}
          selectedIdx={selectedInvoiceIdx}
          onSelectIdx={setSelectedInvoiceIdx}
          activeInvoice={activeInvoice}
          activeRisk={activeRisk}
          activeBuyer={activeBuyer}
          buyers={buyers}
          smes={smes}
          loading={loading}
          dataSource={dataSource}
        />
      </main>
    </div>
  );
}
