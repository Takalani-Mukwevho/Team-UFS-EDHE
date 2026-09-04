// Fictional submission queue. In production: GET /api/cases?status=awaiting
export const mkChecks = (pass, dupNote) => ([
  { name: "All required fields extracted", pass: true, note: "7 / 7" },
  { name: "Due date after issue date", pass: true, note: "valid" },
  { name: "Amount positive and within limit", pass: true, note: "under R500k cap" },
  { name: "Supplier matches KYB profile", pass: true, note: "matched" },
  { name: "Buyer in settlement dataset", pass: true, note: "matched" },
  { name: "Not previously submitted", pass: pass, note: dupNote || "no ledger match" },
]);

export const CASES = [
  { id: "c1", sme: "ABC Construction (Pty) Ltd", smeVerified: true, buyer: "XYZ Corporation", status: "awaiting",
    submitted: "07:42", fields: { invoiceNumber: "INV-1042", amount: 185000, issueDate: "01/09/2026", dueDate: "31/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 99.4, supplier: 98.8, buyer: 99.1, amount: 99.7, issueDate: 97.2, dueDate: 97.6, termsDays: 95.4 },
    checksPass: true },
  { id: "c2", sme: "ABC Construction (Pty) Ltd", smeVerified: true, buyer: "ABC Holdings", status: "awaiting",
    submitted: "08:03", fields: { invoiceNumber: "INV-2087", amount: 420000, issueDate: "12/08/2026", dueDate: "11/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 98.9, supplier: 98.4, buyer: 97.8, amount: 99.5, issueDate: 96.9, dueDate: 97.1, termsDays: 94.8 },
    checksPass: true },
  { id: "c3", sme: "Motsepe Logistics CC", smeVerified: true, buyer: "Highveld Mining Supplies", status: "awaiting",
    submitted: "08:19", fields: { invoiceNumber: "INV-3310", amount: 96400, issueDate: "26/08/2026", dueDate: "25/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 99.1, supplier: 97.9, buyer: 98.6, amount: 99.4, issueDate: 96.4, dueDate: 96.8, termsDays: 93.2 },
    checksPass: true },
  { id: "c4", sme: "Kgosi Electrical (Pty) Ltd", smeVerified: true, buyer: "Meridian Foods", status: "awaiting",
    submitted: "08:31", fields: { invoiceNumber: "INV-5521", amount: 268750, issueDate: "20/08/2026", dueDate: "19/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 98.2, supplier: 96.1, buyer: 91.4, amount: 99.2, issueDate: 88.7, dueDate: 95.9, termsDays: 92.6 },
    checksPass: true },
  { id: "c5", sme: "Vuka Facilities Services", smeVerified: true, buyer: "Cape Union Freight", status: "awaiting",
    submitted: "08:47", fields: { invoiceNumber: "INV-7043", amount: 142300, issueDate: "18/08/2026", dueDate: "17/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 99.0, supplier: 98.2, buyer: 97.4, amount: 99.6, issueDate: 96.1, dueDate: 96.5, termsDays: 94.1 },
    checksPass: true },
  { id: "c6", sme: "Thandi Textiles", smeVerified: false, buyer: "Nkosi Retail Group", status: "awaiting",
    submitted: "09:02", fields: { invoiceNumber: "INV-8890", amount: 58900, issueDate: "29/08/2026", dueDate: "28/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 97.6, supplier: 89.3, buyer: 96.8, amount: 99.1, issueDate: 94.2, dueDate: 94.6, termsDays: 90.4 },
    checksPass: true },
  { id: "c7", sme: "ABC Construction (Pty) Ltd", smeVerified: true, buyer: "XYZ Corporation", status: "blocked",
    submitted: "09:11", fields: { invoiceNumber: "INV-1042", amount: 185000, issueDate: "01/09/2026", dueDate: "31/10/2026", termsDays: 60 },
    confidence: { invoiceNumber: 99.4, supplier: 98.8, buyer: 99.1, amount: 99.7, issueDate: 97.2, dueDate: 97.6, termsDays: 95.4 },
    checksPass: false, dupNote: "matches ledger entry 07:42" },
];

export const SEED_AUDIT = [
  { at: "Yesterday 16:20", who: "R. Naidoo", inv: "INV-0994", sme: "Motsepe Logistics CC",
    engine: "Approve at 80%", final: "Approve at 80%", overridden: false, reason: "" },
  { at: "Yesterday 15:04", who: "R. Naidoo", inv: "INV-1877", sme: "Vuka Facilities Services",
    engine: "Decline (score 63.8)", final: "Approve at 40%", overridden: true,
    reason: "Buyer confirmed the PO by email and has settled three prior invoices with this supplier. Reduced advance to 40% to contain exposure." },
];

export const ANALYST = { name: "T. Loonat", role: "Invoice Finance Desk", initials: "TL" };
