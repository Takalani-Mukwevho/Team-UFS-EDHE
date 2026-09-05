import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import UploadIngestion from "./UploadIngestion";
import OcrExtractionReview from "./OcrExtractionReview";
import BuyerRiskEngine from "./BuyerRiskEngine";
import InstantFundingOffer from "./InstantFundingOffer";
import { useApiData } from "../services/useApiData";
import { scoreCase } from "../engine/scoring";
import { getNarrative, saveNarrative as apiSaveNarrative } from "../services/api";

const PAGES = {
  upload: UploadIngestion,
  ocr: OcrExtractionReview,
  risk: BuyerRiskEngine,
  funding: InstantFundingOffer,
};

const ORDER = ["upload", "ocr", "risk", "funding"];

// ── localStorage helpers for narrative persistence ──────────────────────────
const NARRATIVE_STORAGE_KEY = "absaflow_narratives";

function loadNarratives() {
  try {
    const raw = localStorage.getItem(NARRATIVE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveNarrativeLocal(id, narrative) {
  try {
    const all = loadNarratives();
    all[id] = narrative;
    localStorage.setItem(NARRATIVE_STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export default function UserDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "ocr");
  const [selectedInvoiceIdx, setSelectedInvoiceIdx] = useState(0);
  const [liveMode, setLiveMode] = useState(true);
  const [uploadedInvoices, setUploadedInvoices] = useState([]);
  const [extraBuyers, setExtraBuyers] = useState({});
  const [extraSmes, setExtraSmes] = useState({});
  // Seed narratives from localStorage so they persist across page refreshes
  const [narratives, setNarratives] = useState(loadNarratives);

  const { invoices, buyers, smes, loading, dataSource } = useApiData({ useMockFallback: !liveMode });

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

  // Load narratives from DynamoDB for invoices that don't have one yet
  useEffect(() => {
    if (!combinedInvoices.length) return;
    let cancelled = false;

    for (const inv of combinedInvoices) {
      if (!inv.id) continue;
      if (narratives[inv.id] || inv.riskNarrative) continue;

      getNarrative(inv.id)
        .then((data) => {
          if (!cancelled && data?.narrative) {
            setNarratives((prev) => ({ ...prev, [inv.id]: data.narrative }));
          }
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [combinedInvoices, narratives]);

  // The selected invoice
  const activeInvoice = combinedInvoices[selectedInvoiceIdx] || combinedInvoices[0] || null;

  // Compute risk for the active invoice, merging in AI narrative
  const activeRisk = useMemo(() => {
    if (!activeInvoice) return null;
    const risk = scoreCase(activeInvoice, mergedBuyers);
    // Merge narrative from: localStorage state → invoice object → pipeline
    const narrative =
      narratives[activeInvoice.id] ||
      activeInvoice.riskNarrative ||
      activeInvoice.risk?.narrative ||
      null;
    if (narrative) {
      return { ...risk, narrative };
    }
    return risk;
  }, [activeInvoice, mergedBuyers, narratives]);

  // Get the buyer data for the active invoice
  const activeBuyer = activeInvoice ? (mergedBuyers[activeInvoice.buyer] || null) : null;

  // Current narrative for the active invoice
  const currentNarrative = useMemo(() => {
    if (!activeInvoice) return null;
    return narratives[activeInvoice.id] || activeInvoice.riskNarrative || null;
  }, [activeInvoice, narratives]);

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
    const invoiceBuyerName = newInvoice?.buyer || newBuyer?.companyName || newBuyer?.name;
    if (invoiceBuyerName && newBuyer) {
      setExtraBuyers((prev) => ({ ...prev, [invoiceBuyerName]: newBuyer }));
    }
    if (newBuyer?.companyName) {
      setExtraBuyers((prev) => ({ ...prev, [newBuyer.companyName]: newBuyer }));
    }
    if (newBuyer?.name && newBuyer.name !== newBuyer?.companyName) {
      setExtraBuyers((prev) => ({ ...prev, [newBuyer.name]: newBuyer }));
    }
    if (newSme?.smeId) {
      setExtraSmes((prev) => ({ ...prev, [newSme.smeId]: newSme }));
    }
    setUploadedInvoices((prev) => [newInvoice, ...prev.filter((inv) => inv.id !== newInvoice.id)]);
    setSelectedInvoiceIdx(0);
  }, []);

  // Called by BuyerRiskEngine when a narrative is fetched
  const handleNarrativeReady = useCallback((invId, narr) => {
    setNarratives((prev) => ({ ...prev, [invId]: narr }));
    saveNarrativeLocal(invId, narr);
    apiSaveNarrative(invId, narr).catch(() => {});
    // Also patch the invoice object so activeRisk picks it up
    const inv = combinedInvoices.find((i) => i.id === invId);
    if (inv) {
      inv.riskNarrative = narr;
      if (inv.risk) inv.risk.narrative = narr;
    }
  }, [combinedInvoices]);

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
          narrative={currentNarrative}
          onNarrativeReady={handleNarrativeReady}
          buyers={mergedBuyers}
          smes={mergedSmes}
          loading={loading}
          dataSource={dataSource}
        />
      </main>
    </div>
  );
}
