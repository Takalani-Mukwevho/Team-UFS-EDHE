// Three "judge demo" scenarios that drive the interactive numbers across every
// screen of the pipeline. Swap this out for real API data in production.
//
// SOURCE OF TRUTH: these values mirror the credit desk's engine exactly
// (frontend/credit-desk/src/data/cases.js and src/engine/policy.js). Both front
// ends are shown to the same judges, so an invoice must carry the same number,
// buyer, amount, terms, score, band and advance rate on both screens.
// POLICY: Low >= 80 -> 80% advance, Medium >= 65 -> 60%, otherwise High -> declined.
// feeRate is 0.02 for every funded invoice.
export const SCENARIOS = {
  A: {
    id: "A",
    label: "Happy Path • Low Risk",
    filename: "INV-1042_XYZ_Corporation.pdf",
    invoiceNo: "INV-1042",
    supplier: "ABC Construction (Pty) Ltd",
    buyer: "XYZ Corporation",
    buyerReg: "2014/098412/07",
    buyerVat: "4820193482",
    poRef: "PO-XYZ-88219",
    issueDate: "01 Sep 2026",
    dueDate: "31 Oct 2026 (60d)",
    terms: "60 Days Net",
    grossAmount: 185000.0,
    advanceRate: 0.8,
    feeRate: 0.02,
    riskScore: 96.3,
    riskBand: "Low",
    onTimeSettlement: 96,
    avgSettlementDays: 28,
    fraudProbability: 0.02,
    statusText:
      "High-trust buyer with 96% historical on-time settlement, averaging 28 days against 60-day terms. Score 96.3 places this in the Low band, which carries an 80% advance rate and a 20% retention margin.",
  },
  B: {
    id: "B",
    label: "High Risk • Declined",
    filename: "INV-2087_ABC_Holdings.pdf",
    invoiceNo: "INV-2087",
    supplier: "ABC Construction (Pty) Ltd",
    buyer: "ABC Holdings",
    buyerReg: "2008/112903/06",
    buyerVat: "4190288190",
    poRef: "PO-ABH-40213",
    issueDate: "12 Aug 2026",
    dueDate: "11 Oct 2026 (60d)",
    terms: "60 Days Net",
    grossAmount: 420000.0,
    advanceRate: 0,
    feeRate: 0.02,
    riskScore: 62.3,
    riskBand: "High",
    onTimeSettlement: 64,
    avgSettlementDays: 71,
    fraudProbability: 0.41,
    statusText:
      "Buyer settles only 64% of invoices on time, averaging 71 days against 60-day terms. Score 62.3 falls below the 65 threshold, so no advance is offered. An analyst may override with a recorded reason.",
  },
  C: {
    id: "C",
    label: "Duplicate • Blocked at Verification",
    filename: "INV-1042_XYZ_Corporation (1).pdf",
    invoiceNo: "INV-1042",
    supplier: "ABC Construction (Pty) Ltd",
    buyer: "XYZ Corporation",
    buyerReg: "2014/098412/07",
    buyerVat: "4820193482",
    poRef: "PO-XYZ-88219",
    issueDate: "01 Sep 2026",
    dueDate: "31 Oct 2026 (60d)",
    terms: "60 Days Net",
    grossAmount: 185000.0,
    advanceRate: 0,
    feeRate: 0,
    // Scores well on its own merits — same clean document, same excellent buyer.
    // Verification stops it on the ledger check before scoring is ever applied.
    // A good score is not a licence to fund the same debt twice.
    riskScore: 86.3,
    riskBand: "Low",
    onTimeSettlement: 96,
    avgSettlementDays: 28,
    fraudProbability: 0.986,
    blocked: true,
    statusText:
      "DUPLICATE: INV-1042 from ABC Construction (Pty) Ltd for R185,000 is already on the submitted ledger. The pipeline stopped before scoring, so no advance can be made twice against the same debt.",
  },
};

export const zar = (value) =>
  `R ${Number(value).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const NAV_STEPS = [
  { key: "upload", label: "1. Upload & Ingestion", short: "1. Upload", icon: "upload_file" },
  { key: "ocr", label: "2. OCR & Extraction", short: "2. OCR Review", icon: "document_scanner" },
  { key: "risk", label: "3. Buyer Verification", short: "3. Buyer Risk", icon: "verified_user" },
  { key: "funding", label: "4. Instant Cash-Out", short: "4. Decision", icon: "payments" },
  // { key: "exceptions", label: "5. Audit & Exceptions", short: "5. Audit", icon: "gavel" },
];
