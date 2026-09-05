// =============================================================================
// Amazon Bedrock AI Service for SHIFA
// =============================================================================
// Provides two AI capabilities:
// 1. Intelligent Invoice Extraction — understands ANY invoice format
// 2. Risk Narrative Generation — explains funding decisions in plain language
//
// In production, calls go through API Gateway → Lambda → Bedrock.
// In demo mode, returns realistic AI-style responses.
// =============================================================================

import config from './config.js';

// ---------------------------------------------------------------------------
// Response Cache — avoids burning Bedrock credits on repeat calls
// ---------------------------------------------------------------------------
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function cacheKey(endpoint, body) {
  // Deterministic key from endpoint + sorted body
  return endpoint + '|' + JSON.stringify(body, Object.keys(body).sort());
}

function getCached(key) {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  _cache.delete(key);
  return null;
}

function setCache(key, data) {
  _cache.set(key, { data, ts: Date.now() });
  // Prune if too many entries
  if (_cache.size > 50) {
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BEDROCK_CONFIG = {
  // Which model to use for extraction
  extractionModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  // Which model to use for risk narrative
  narrativeModel: 'anthropic.claude-3-haiku-20240307-v1:0',
  // Max tokens for extraction response
  extractionMaxTokens: 2048,
  // Max tokens for narrative response
  narrativeMaxTokens: 1024,
  // Temperature for extraction (low = precise)
  extractionTemp: 0.0,
  // Temperature for narrative (slightly higher = natural language)
  narrativeTemp: 0.3,
};

// ---------------------------------------------------------------------------
// Extraction Prompt Template
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `You are an expert invoice data extraction AI. Analyze the following invoice document text and extract ALL relevant fields with high precision.

Return a JSON object with exactly these fields:
{
  "invoiceNumber": "string",
  "issueDate": "DD/MM/YYYY",
  "dueDate": "DD/MM/YYYY",
  "termsDays": number,
  "poRef": "string or null",
  "vendorName": "string",
  "vendorAddress": "string",
  "vendorReg": "registration number",
  "vendorVat": "VAT number",
  "buyerName": "string",
  "buyerAddress": "string",
  "buyerVat": "VAT number",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "amount": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "totalAmount": number,
  "currency": "ZAR",
  "confidence": {
    "invoiceNumber": number 0-100,
    "vendorName": number 0-100,
    "buyerName": number 0-100,
    "amount": number 0-100,
    "dates": number 0-100,
    "lineItems": number 0-100
  },
  "extractionNotes": "string — any warnings or observations about data quality"
}

Rules:
- Extract EXACTLY what you see in the document. Do not invent data.
- If a field is missing or unreadable, use null and set its confidence to 0.
- amounts must be numeric (no currency symbols).
- Return ONLY the JSON object, no markdown, no explanation.`;

// ---------------------------------------------------------------------------
// Risk Narrative Prompt Template
// ---------------------------------------------------------------------------

const RISK_NARRATIVE_PROMPT = `You are a senior credit analyst at Absa Bank's Invoice Finance division. Analyze this invoice funding case and write a concise, professional risk narrative.

Input data:
- Invoice: {invoiceNumber} for R{amount}
- Supplier (SME): {supplier} ({industry}, {yearsInOperation} years, revenue R{revenue})
- Buyer (Debtor): {buyer} ({sector})
- Payment terms: {termsDays} days
- Buyer on-time payment rate: {onTimeRate}%
- Buyer average settlement: {avgSettlementDays} days
- Risk score: {riskScore}/100 ({riskBand})
- Invoice verification: {verificationStatus}

Write a 2-3 sentence narrative that:
1. States whether this invoice is suitable for early funding
2. Explains the key factors supporting or concerning the decision
3. Uses plain language an SME owner would understand

Tone: Professional, trustworthy, clear. Like a senior banker explaining to a colleague.
Do NOT use jargon like "probability of default" or "credit exposure".
Do NOT include the raw numbers in the narrative — reference them naturally.`;

// ---------------------------------------------------------------------------
// Main API Functions
// ---------------------------------------------------------------------------

/**
 * Extract invoice data using Bedrock AI
 * 
 * @param {string} rawText - Extracted text from the PDF
 * @param {string} fileName - Original filename
 * @param {object} options - Additional options
 * @returns {object} Extracted invoice data with confidence scores
 */
export async function aiExtractInvoice(rawText, fileName = '', options = {}) {
  const { onProgress } = options;

  // Try real Bedrock API first
  try {
    onProgress?.('Calling Amazon Bedrock Claude for intelligent extraction...');
    const result = await callBedrockAPI('/api/ai/extract', {
      rawText: rawText.substring(0, 8000), // Limit text size for Lambda
      fileName,
      model: BEDROCK_CONFIG.extractionModel,
    });
    onProgress?.('Extraction complete — AI confidence scores generated');
    return { ...result, source: 'bedrock' };
  } catch (err) {
    console.warn('Bedrock extraction failed, using intelligent fallback:', err.message);
    onProgress?.('AI extraction unavailable — using enhanced parser');
    return { ...smartExtractFallback(rawText, fileName), source: 'fallback' };
  }
}

/**
 * Generate a risk narrative using Bedrock AI
 * 
 * @param {object} caseData - The full case data including risk, buyer, SME info
 * @returns {object} { narrative: string, keyFactors: string[], recommendation: string }
 */
export async function aiGenerateRiskNarrative(caseData) {
  const {
    invoice = {},
    risk = {},
    buyer = {},
    sme = {},
  } = caseData;

  const prompt = RISK_NARRATIVE_PROMPT
    .replace('{invoiceNumber}', invoice.fields?.invoiceNumber || 'N/A')
    .replace('{amount}', (invoice.fields?.amount || 0).toLocaleString('en-ZA'))
    .replace('{supplier}', invoice.sme || 'Unknown')
    .replace('{industry}', sme.industry || 'Unknown')
    .replace('{yearsInOperation}', sme.yearsInOperation || 'N/A')
    .replace('{revenue}', (sme.annualRevenue || 0).toLocaleString('en-ZA'))
    .replace('{buyer}', invoice.buyer || 'Unknown')
    .replace('{sector}', buyer.sector || 'Unknown')
    .replace('{termsDays}', invoice.fields?.termsDays || 'N/A')
    .replace('{onTimeRate}', Math.round((buyer.onTimeRate || 0) * 100))
    .replace('{avgSettlementDays}', buyer.avgSettlementDays || 'N/A')
    .replace('{riskScore}', risk.total?.toFixed(1) || 'N/A')
    .replace('{riskBand}', risk.band || 'N/A')
    .replace('{verificationStatus}', invoice.checksPass ? 'Passed all checks' : 'Issues detected');

  // Try real Bedrock API first — send structured data that Lambda expects
  try {
    const result = await callBedrockAPI('/api/ai/narrative', {
      invoiceNumber: invoice.fields?.invoiceNumber || 'N/A',
      amount: invoice.fields?.amount || 0,
      supplierName: invoice.sme || 'Unknown',
      supplierIndustry: sme.industry || 'Unknown',
      supplierYears: sme.yearsInOperation || 5,
      supplierRevenue: sme.annualRevenue || 0,
      buyerName: invoice.buyer || 'Unknown',
      buyerSector: buyer.sector || 'Unknown',
      buyerOnTimeRate: buyer.onTimeRate || 0,
      buyerAvgSettlementDays: buyer.avgSettlementDays || 0,
      termsDays: invoice.fields?.termsDays || 60,
      riskScore: risk.total || 0,
      riskBand: risk.band || 'Medium',
      verificationStatus: invoice.checksPass ? 'Passed all checks' : 'Issues detected',
    });
    return { ...result, source: 'bedrock' };
  } catch (err) {
    console.warn('Bedrock narrative failed, using smart fallback:', err.message);
    return { ...generateSmartNarrative(caseData), source: 'fallback' };
  }
}

/**
 * Analyze invoice anomalies using Bedrock AI
 * 
 * @param {object} extractionData - Extracted invoice data
 * @returns {object} { anomalies: string[], riskFlags: string[], recommendations: string[] }
 */
export async function aiAnalyzeAnomalies(extractionData) {
  try {
    const result = await callBedrockAPI('/api/ai/analyze', {
      data: extractionData,
      model: BEDROCK_CONFIG.narrativeModel,
    });
    return { ...result, source: 'bedrock' };
  } catch (err) {
    console.warn('Bedrock anomaly analysis failed:', err.message);
    return { ...smartAnomalyDetection(extractionData), source: 'fallback' };
  }
}

// ---------------------------------------------------------------------------
// API Layer
// ---------------------------------------------------------------------------

async function callBedrockAPI(endpoint, body) {
  // Check cache first (only for narrative — extraction is per-document, always fresh)
  if (endpoint.includes('/narrative')) {
    const key = cacheKey(endpoint, body);
    const cached = getCached(key);
    if (cached) {
      console.log('[Bedrock Cache] HIT for', endpoint);
      return cached;
    }
  }

  const url = `${config.apiBaseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Bedrock API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Cache successful narrative responses
    if (endpoint.includes('/narrative')) {
      const key = cacheKey(endpoint, body);
      setCache(key, data);
      console.log('[Bedrock Cache] STORED for', endpoint);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('AI request timed out');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Smart Fallbacks (when Bedrock is unavailable)
// ---------------------------------------------------------------------------

/**
 * Enhanced fallback extraction — smarter than raw regex
 */
function smartExtractFallback(rawText, fileName) {
  // Try to find invoice patterns in any text
  const invoiceMatch = rawText.match(/(?:invoice|inv)[\s#:.-]*(\d{4,}[-\/]?\d*)/i);
  const amountMatches = rawText.match(/R\s*([\d,]+\.?\d*)/g);
  const dateMatches = rawText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g);

  const amounts = (amountMatches || []).map(m =>
    parseFloat(m.replace(/[R\s,]/g, ''))
  ).filter(n => n > 0 && n < 10000000);

  const totalAmount = amounts.length > 0 ? amounts[amounts.length - 1] : 0;

  return {
    invoiceNumber: invoiceMatch?.[1] || 'INV-' + Date.now().toString(36).toUpperCase(),
    totalAmount,
    confidence: {
      invoiceNumber: invoiceMatch ? 75 : 20,
      vendorName: 15,
      buyerName: 15,
      amount: amounts.length > 0 ? 60 : 10,
      dates: dateMatches ? 50 : 10,
      lineItems: 5,
    },
    extractionNotes: 'Enhanced fallback extraction — upload a standard invoice format for higher accuracy',
  };
}

/**
 * Generate a smart risk narrative from case data
 */
function generateSmartNarrative(caseData) {
  const { risk = {}, buyer = {}, invoice = {}, sme = {} } = caseData;
  const band = risk.band || 'Medium';
  const onTime = Math.round((buyer.onTimeRate || 0) * 100);
  const avgDays = buyer.avgSettlementDays || 0;
  const terms = invoice.fields?.termsDays || 60;

  let narrative = '';
  let keyFactors = [];
  let recommendation = '';

  if (band === 'Low') {
    narrative = `${invoice.buyer || 'The buyer'} has a strong payment track record, settling ${onTime}% of invoices on time with an average of ${avgDays} days. This invoice appears suitable for early funding with low risk.`;
    keyFactors = [
      `${onTime}% on-time payment rate`,
      `Average settlement ${avgDays} days (vs ${terms}-day terms)`,
      `SME ${invoice.smeVerified ? 'KYB verified' : 'pending verification'}`,
    ];
    recommendation = 'Approve for immediate funding';
  } else if (band === 'Medium') {
    narrative = `${invoice.buyer || 'The buyer'} shows a moderate payment pattern at ${onTime}% on-time, averaging ${avgDays} days. Some caution is warranted — this invoice may benefit from partial funding.`;
    keyFactors = [
      `${onTime}% on-time payment rate`,
      `Settlement averages ${avgDays} days against ${terms}-day terms`,
      `Risk score ${risk.total?.toFixed(1) || 'N/A'}/100`,
    ];
    recommendation = 'Consider partial advance or enhanced monitoring';
  } else {
    narrative = `${invoice.buyer || 'The buyer'} has inconsistent payment history at only ${onTime}% on-time. This invoice carries elevated risk and may not be suitable for early funding.`;
    keyFactors = [
      `Only ${onTime}% on-time payment rate`,
      `Settlement significantly exceeds ${terms}-day terms`,
      `Risk score below funding threshold`,
    ];
    recommendation = 'Recommend standard collection terms';
  }

  return { narrative, keyFactors, recommendation };
}

/**
 * Smart anomaly detection from extracted data
 */
function smartAnomalyDetection(data) {
  const anomalies = [];
  const riskFlags = [];
  const recommendations = [];

  // Check for round numbers (potential fabrication)
  if (data.totalAmount && data.totalAmount % 1000 === 0 && data.totalAmount > 10000) {
    anomalies.push('Invoice total is a round number — verify authenticity');
    riskFlags.push('medium');
  }

  // Check for very high amounts
  if (data.totalAmount > 500000) {
    anomalies.push(`High-value invoice: R ${data.totalAmount.toLocaleString()}`);
    riskFlags.push('high');
    recommendations.push('Request supporting purchase order');
  }

  // Check date consistency
  if (data.issueDate && data.dueDate) {
    const issue = new Date(data.issueDate);
    const due = new Date(data.dueDate);
    if (due <= issue) {
      anomalies.push('Due date is before or equal to issue date');
      riskFlags.push('high');
    }
  }

  // Check line item consistency
  if (data.lineItems && data.lineItems.length > 0) {
    const lineTotal = data.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    if (data.totalAmount && Math.abs(lineTotal - data.totalAmount) > 1) {
      anomalies.push(`Line items sum (R ${lineTotal.toLocaleString()}) differs from total (R ${data.totalAmount.toLocaleString()})`);
      riskFlags.push('medium');
    }
  }

  if (anomalies.length === 0) {
    anomalies.push('No anomalies detected');
    riskFlags.push('low');
  }

  return { anomalies, riskFlags, recommendations };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { BEDROCK_CONFIG };
