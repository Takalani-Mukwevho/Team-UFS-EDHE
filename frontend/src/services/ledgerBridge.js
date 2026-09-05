// Shared-browser ledger overlay.
//
// The SME and bank screens both poll the same AWS DynamoDB ledger, and the SME's
// acceptance of an advance is persisted to the invoice there (see the invoice
// status API). This overlay is a browser-local mirror of that write so the two
// screens stay in step even while the backend is being redeployed or is briefly
// unreachable: whichever screen accepts first records it here, and both screens
// apply it on every refresh.
//
// Invoices are keyed by every identifier we know (UI id, raw InvoiceId,
// raw InvoiceNumber, extracted invoice number) so the overlay survives
// whichever shape a screen is holding.

import { invoiceFlags } from '../engine/decision.js';

const OVERLAY_KEY = 'absaflow:ledger-overlay';

function readOverlay() {
  try {
    const raw = localStorage.getItem(OVERLAY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeOverlay(overlay) {
  try {
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlay));
  } catch {
    // localStorage unavailable — API persistence still covers the demo
  }
}

// Record the SME's acceptance of an advance so both screens see it.
export function recordSmeAcceptance(invoiceId, disbursement) {
  if (!invoiceId || !disbursement) return;
  const overlay = readOverlay();
  overlay[invoiceId] = {
    ...(overlay[invoiceId] || {}),
    disbursement,
    recordedAt: new Date().toISOString(),
  };
  writeOverlay(overlay);
}

// Clear every recorded acceptance/flag in the overlay so invoices fall back to
// their default unconfirmed (pending) states on both screens.
export function clearLedgerOverlay() {
  try {
    localStorage.removeItem(OVERLAY_KEY);
  } catch {
    // localStorage unavailable — nothing to clear
  }
}

function aliasKeysOf(inv) {
  if (!inv) return [];
  return [inv.id, inv.raw?.invoiceId, inv.raw?.invoiceNumber, inv.fields?.invoiceNumber]
    .filter((k) => typeof k === 'string' && k.length > 0);
}

// Layer any recorded acceptances over a list of invoices fetched from the ledger.
// The API record wins when it already carries a disbursement; the overlay fills
// the gap when the write has not reached the ledger yet.
export function applyLedgerOverlay(invoices) {
  if (!Array.isArray(invoices) || invoices.length === 0) return invoices;
  const overlay = readOverlay();
  const ids = Object.keys(overlay);
  if (ids.length === 0) return invoices;

  return invoices.map((inv) => {
    const aliases = aliasKeysOf(inv);
    const record = ids.find((id) => aliases.includes(id) && overlay[id]?.disbursement);
    if (!record) return inv;
    const existing = inv.disbursement || inv.raw?.disbursement;
    if (existing) return inv;

    const merged = { ...inv, disbursement: overlay[record].disbursement };
    merged.flags = invoiceFlags(merged);
    return merged;
  });
}
