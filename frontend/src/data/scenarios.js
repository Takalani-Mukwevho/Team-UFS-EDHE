// Three "judge demo" scenarios that drive the interactive numbers across every
// screen of the pipeline. Swap this out for real API data in production.
export const SCENARIOS = {
  A: {
    id: "A",
    label: "Happy Path • Grade A",
    filename: "XYZ-CORP-INV-2026-0891.pdf",
    invoiceNo: "INV-1042",
    supplier: "ABC Construction (Pty) Ltd",
    buyer: "XYZ Corporation Ltd",
    buyerReg: "2014/098412/07",
    buyerVat: "4820193482",
    poRef: "PO-XYZ-88219",
    dueDate: "31 Oct 2026 (60d)",
    terms: "60 Days Net",
    grossAmount: 185000.0,
    advanceRate: 0.8,
    feeRate: 0.02,
    riskGrade: "A",
    onTimeSettlement: 96,
    fraudProbability: 0.02,
    statusText:
      "High-trust debtor with 96% historical on-time settlement. Instant automated factoring approval with 10% cash retention margin.",
  },
  B: {
    id: "B",
    label: "Moderate Risk • Grade C",
    filename: "ABC-HOLDINGS-INVOICE-773.pdf",
    invoiceNo: "INV-1077",
    supplier: "ABC Construction (Pty) Ltd",
    buyer: "ABC Holdings Limited",
    buyerReg: "2008/112903/06",
    buyerVat: "4190288190",
    poRef: "PO-ABH-40213",
    dueDate: "30 Nov 2026 (90d)",
    terms: "90 Days Net",
    grossAmount: 420000.0,
    advanceRate: 0.6,
    feeRate: 0.0187,
    riskGrade: "C",
    onTimeSettlement: 64,
    fraudProbability: 0.41,
    statusText:
      "Automated risk policy flagged 90-day extended credit cycle. Required collateral retention: 40%.",
  },
  C: {
    id: "C",
    label: "Double-Financing Alert",
    filename: "INV-1042-DUPLICATE-ALERT.pdf",
    invoiceNo: "INV-1042",
    supplier: "ABC Construction (Pty) Ltd",
    buyer: "Apex Infrastructure Consortium",
    buyerReg: "2019/338291/07",
    buyerVat: "4990391201",
    poRef: "PO-APX-77310",
    dueDate: "15 Oct 2026 (Expired)",
    terms: "60 Days Net",
    grossAmount: 890000.0,
    advanceRate: 0,
    feeRate: 0,
    riskGrade: "E",
    onTimeSettlement: 0,
    fraudProbability: 98.6,
    blocked: true,
    statusText:
      "FRAUD ALERT: Duplicate invoice hash detected in National Factoring Registry. Blocked under Section 24 Prevention of Financial Crime.",
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
