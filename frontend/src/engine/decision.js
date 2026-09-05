// Decision & disbursement state shared by the SME-facing offer and the bank console.
//
// A single invoice goes through three states across the two screens:
//   1. 'pending'   — the credit desk has not decided yet (SME accept button disabled)
//   2. 'approved'  — the desk accepted the recommendation (SME accept button unlocks)
//   3. disbursed   — the SME accepted the advance and the money was paid out
// 'declined' — the desk turned the recommendation down, no advance is possible.
//
// Ledger statuses arrive from the API as the InvoiceStatus enum serialised as an
// int (0 Pending, 1 Uploaded, 2 Extracted, 3 Verified, 4 Funded, 5 Rejected,
// 6 Duplicate) or as the strings used by the local/mock ledger.

const APPROVED_STATUSES = [4, 'Funded', 'decided'];
const DECLINED_STATUSES = [5, 6, 'Rejected', 'Duplicate', 'blocked'];

// The decision the credit desk has made for this invoice:
// 'approved' — the recommendation was accepted, disbursement may proceed
// 'declined' — the desk declined / the invoice is blocked, no disbursement
// 'pending'  — still awaiting the desk decision
export function deskDecisionState(inv) {
  if (!inv) return 'pending';
  const rawStatus = inv.raw?.status;
  const s = rawStatus === undefined ? inv.status : rawStatus;
  if (APPROVED_STATUSES.includes(s)) return 'approved';
  if (DECLINED_STATUSES.includes(s)) return 'declined';
  return 'pending';
}

// The recorded payout for this invoice, or null if the SME has not accepted yet.
// Read from the top-level invoice (what the shared ledger/overlay attaches) and
// fall back to the raw API record.
export function disbursementOf(inv) {
  if (!inv) return null;
  const dis = inv.disbursement || inv.raw?.disbursement || inv.flags?.disbursement;
  return dis && dis.acceptedAt ? dis : null;
}

// Explicit flags for checking an invoice's decision state in one place.
export function invoiceFlags(inv) {
  if (!inv) return { deskDecision: 'pending', approved: false, declined: false, pending: true, disbursed: false, disbursement: null };
  const d = deskDecisionState(inv);
  const disbursement = disbursementOf(inv);
  return {
    deskDecision: d,
    approved: d === 'approved',
    declined: d === 'declined',
    pending: d === 'pending',
    disbursed: !!disbursement,
    disbursement,
  };
}
