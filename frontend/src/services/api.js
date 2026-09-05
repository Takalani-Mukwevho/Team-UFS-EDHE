// Shifa API Service Layer
// Provides functions to interact with the backend Lambda functions via API Gateway

import config from './config.js';
import { invoiceFlags } from '../engine/decision.js';

/**
 * Base fetch wrapper with timeout and error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${config.apiBaseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...config.defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =============================================================================
// INVOICE ENDPOINTS
// =============================================================================

/** Get all invoices */
export async function getInvoices() {
  const data = await apiFetch('/api/invoices');
  return data.invoices || [];
}

/** Get a specific invoice by ID */
export async function getInvoice(invoiceIdOrNumber) {
  return await apiFetch(`/api/invoices/${encodeURIComponent(invoiceIdOrNumber)}`);
}

/** Get invoices for a specific SME */
export async function getInvoicesBySme(smeId) {
  const data = await apiFetch(`/api/invoices/sme/${encodeURIComponent(smeId)}`);
  return data.invoices || [];
}

/** Get invoices for a specific buyer */
export async function getInvoicesByBuyer(buyerId) {
  const data = await apiFetch(`/api/invoices/buyer/${encodeURIComponent(buyerId)}`);
  return data.invoices || [];
}

/** Upload an invoice document for extraction */
export async function uploadInvoice({ smeId, buyerId, fileName, fileBase64, contentType = 'application/pdf' }) {
  return await apiFetch('/api/invoices/extract', {
    method: 'POST',
    body: JSON.stringify({ smeId, buyerId, fileName, fileBase64, contentType }),
  });
}

/** Verify an invoice */
export async function verifyInvoice(invoiceId) {
  return await apiFetch('/api/invoices/verify', {
    method: 'POST',
    body: JSON.stringify({ invoiceId }),
  });
}

/** Evaluate funding decision for an invoice */
export async function evaluateFunding(invoiceId) {
  return await apiFetch('/api/invoices/funding', {
    method: 'POST',
    body: JSON.stringify({ invoiceId }),
  });
}

/** Update invoice status (persist decisions to DynamoDB).
 * `decision` persists the desk's funding decision; `extra` carries other
 * ledger fields such as `disbursement` (the SME's accepted payout). */
export async function updateInvoiceStatus(invoiceId, status, decision = null, extra = null) {
  const body = { status, ...(extra || {}) };
  if (decision) body.decision = decision;
  return await apiFetch(`/api/invoices/${encodeURIComponent(invoiceId)}/status`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// =============================================================================
// BUYER ENDPOINTS
// =============================================================================

/** Get all buyers */
export async function getBuyers() {
  const data = await apiFetch('/api/buyers');
  return data.buyers || [];
}

/** Get a specific buyer by ID */
export async function getBuyer(buyerId) {
  return await apiFetch(`/api/buyers/${encodeURIComponent(buyerId)}`);
}

// =============================================================================
// SME ENDPOINTS
// =============================================================================

/** Get all SMEs */
export async function getSmes() {
  const data = await apiFetch('/api/smes');
  return data.smes || [];
}

/** Get a specific SME by ID */
export async function getSme(smeId) {
  return await apiFetch(`/api/smes/${encodeURIComponent(smeId)}`);
}

// =============================================================================
// DEMO ENDPOINTS
// =============================================================================

/** Run the demo orchestrator */
export async function runDemo() {
  return await apiFetch('/api/demo/run', { method: 'POST' });
}

// =============================================================================
// NOTIFICATION ENDPOINTS
// =============================================================================

/** Send an email notification via SNS */
export async function sendEmailNotification({ subject, message, eventType = 'notification' }) {
  return await apiFetch('/api/notify/email', {
    method: 'POST',
    body: JSON.stringify({ subject, message, eventType, recipient: 'mihlalidataweb@gmail.com' }),
  });
}

// =============================================================================
// TRANSFORMATION HELPERS
// =============================================================================

export function transformInvoiceForUI(invoice, buyer, sme) {
  if (!invoice) return null;
  const extracted = invoice.extractedData || {};
  const funding = invoice.fundingDecision;
  const dueDate = new Date(invoice.dueDate);
  const issueDate = new Date(invoice.issueDate);
  const termsDays = Math.ceil((dueDate - issueDate) / (1000 * 60 * 60 * 24));

  const uiInvoice = {
    id: invoice.invoiceId || invoice.invoiceNumber,
    sme: sme?.companyName || extracted.vendorName || 'Unknown SME',
    smeVerified: sme?.isVerified || false,
    smeId: invoice.smeId,
    buyer: buyer?.companyName || extracted.buyerName || 'Unknown Buyer',
    buyerId: invoice.buyerId,
    status: mapInvoiceStatus(invoice.status),
    submitted: formatTime(invoice.createdAt),
    fields: {
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      issueDate: formatDate(invoice.issueDate),
      dueDate: formatDate(invoice.dueDate),
      termsDays,
      currency: invoice.currency || 'ZAR',
    },
    confidence: {
      invoiceNumber: 99.5,
      supplier: sme?.isVerified ? 98.5 : 85.0,
      buyer: buyer ? 97.0 : 80.0,
      amount: 99.8,
      issueDate: 98.0,
      dueDate: 97.5,
      termsDays: 95.0,
    },
    checksPass: invoice.status !== 'Duplicate' && invoice.status !== 'Rejected',
    dupNote: invoice.status === 'Duplicate' ? 'matches ledger entry' : undefined,
    extractedData: extracted,
    fundingDecision: funding,
    disbursement: invoice.disbursement || null,
    raw: invoice,
  };

  // Flags for checking the decision/disbursement status without re-parsing the
  // raw ledger shape at every call site.
  uiInvoice.flags = invoiceFlags(uiInvoice);
  return uiInvoice;
}

export function transformBuyerForUI(buyer) {
  if (!buyer) return null;
  const ph = buyer.paymentHistory || {};
  const totalInvoices = (ph.totalInvoicesPaid || 0) + (ph.totalInvoicesOutstanding || 0);
  const onTimeRate = totalInvoices > 0
    ? (totalInvoices - (ph.latePayments || 0)) / totalInvoices
    : 0;
  const avgDays = ph.averagePaymentDays || 45;

  return {
    key: buyer.companyName,
    historicalInvoices: totalInvoices || buyer.companyName.length * 10,
    onTimeRate: onTimeRate || 0.85,
    avgSettlementDays: avgDays,
    sector: buyer.industry || 'Unknown',
    recent: Array.from({ length: 12 }, () =>
      Math.max(15, Math.min(90, avgDays + Math.floor(Math.random() * 20 - 10)))
    ),
    raw: buyer,
  };
}

export function transformSmeForUI(sme) {
  if (!sme) return null;
  return {
    key: sme.smeId,
    companyName: sme.companyName,
    registrationNumber: sme.registrationNumber,
    industry: sme.industry,
    yearsInOperation: sme.yearsInOperation,
    annualRevenue: sme.annualRevenue,
    isVerified: sme.isVerified,
    address: sme.address,
    bankAccountNumber: sme.bankAccountNumber,
    raw: sme,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function mapInvoiceStatus(status) {
  const statusMap = {
    'Pending': 'awaiting',
    'Uploaded': 'awaiting',
    'Extracted': 'awaiting',
    'Verified': 'awaiting',
    'Funded': 'decided',
    'Rejected': 'blocked',
    'Duplicate': 'blocked',
  };
  return statusMap[status] || 'awaiting';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}
