import { useState, useMemo, useCallback, useEffect } from "react";
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
  const [uploadedInvoices, setUploadedInvoices] = useState([]);
  const [extraBuyers, setExtraBuyers] = useState({});
  const [extraSmes, setExtraSmes] = useState({});

  const { invoices, buyers, smes, loading, dataSource, refetch } = useApiData({ useMockFallback: !liveMode });

  // Merge extra buyers and smes from uploads
  const mergedBuyers = useMemo(() => ({
    ...buyers,
    ...extraBuyers,
  }), [buyers, extraBuyers]);

  const mergedSmes = useMemo(() => ({
    ...smes,
    ...extraSmes,
  }), [smes, extraSmes]);

  // Combined invoices: newly uploaded invoices come first, followed by reversed DB invoices
  const combinedInvoices = useMemo(() => {
    const base = invoices.slice().reverse();
    const uploadedFiltered = uploadedInvoices.filter(
      (u) => !base.some((b) => b.id === u.id || b.fields?.invoiceNumber === u.fields?.invoiceNumber)
    );
    return [...uploadedFiltered, ...base];
  }, [invoices, uploadedInvoices]);

  // The selected invoice
  const activeInvoice = combinedInvoices[selectedInvoiceIdx] || combinedInvoices[0] || null;

  // While the funding offer tab is open, keep the SME side in step with the
  // credit desk: re-read the shared ledger on entry and then every few seconds
  // so an acceptance (or decline) shows up automatically.
  useEffect(() => {
    if (activeTab !== "funding") return;
    refetch();
    const id = setInterval(() => refetch(), 8000);
    return () => clearInterval(id);
  }, [activeTab, refetch]);

  // Compute risk for the active invoice
  const activeRisk = useMemo(() => {
    if (!activeInvoice) return null;
    return scoreCase(activeInvoice, mergedBuyers);
  }, [activeInvoice, mergedBuyers]);

  // Get the buyer data for the active invoice
  const activeBuyer = activeInvoice ? (mergedBuyers[activeInvoice.buyer] || null) : null;

  const ActivePage = PAGES[activeTab];

  function goTo(tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setActiveTab("upload");
    setSelectedInvoiceIdx(0);
  }

  const handleUploadInvoice = useCallback((newInvoice, newBuyer, newSme) => {
    if (newBuyer?.companyName || newBuyer?.name) {
      const bName = newBuyer.companyName || newBuyer.name;
      setExtraBuyers((prev) => ({ ...prev, [bName]: newBuyer }));
    }
    if (newSme?.smeId) {
      setExtraSmes((prev) => ({ ...prev, [newSme.smeId]: newSme }));
    }
    setUploadedInvoices((prev) => [newInvoice, ...prev.filter((inv) => inv.id !== newInvoice.id)]);
    setSelectedInvoiceIdx(0); // Immediately activate the uploaded invoice
  }, []);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <Header
        active={activeTab}
        onNavigate={goTo}
        onReset={handleReset}
        liveMode={liveMode}
        onToggleLive={() => setLiveMode((v) => !v)}
      />
      <main className="w-full pt-16 min-h-screen">
        <ActivePage
          key={activeTab}
          onContinue={() => {
            const next = ORDER[ORDER.indexOf(activeTab) + 1];
            if (next) goTo(next);
          }}
          onNavigate={goTo}
          onUploadInvoice={handleUploadInvoice}
          invoices={combinedInvoices}
          selectedIdx={selectedInvoiceIdx}
          onSelectIdx={setSelectedInvoiceIdx}
          activeInvoice={activeInvoice}
          activeRisk={activeRisk}
          activeBuyer={activeBuyer}
          buyers={mergedBuyers}
          smes={mergedSmes}
          loading={loading}
          dataSource={dataSource}
          onRefresh={refetch}
          refreshing={loading}
        />
      </main>
    </div>
  );
}
