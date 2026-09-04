import { BUYERS } from '../data/buyers.js'
import { WEIGHTS, BANDS, POLICY } from './policy.js'

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Mirrors WeightedRiskEngine.Score(...) in the ASP.NET Core API.
export function scoreCase(c) {
  const b = BUYERS[c.buyer]

  const parts = [
    {
      key: 'buyer', name: 'Buyer on-time payment rate',
      raw: b.onTimeRate * 100, w: WEIGHTS.buyer,
      detail: Math.round(b.onTimeRate * 100) + '% of ' + b.historicalInvoices + ' settled invoices',
    },
    {
      key: 'settlement', name: 'Buyer settlement speed',
      raw: clamp(100 - (b.avgSettlementDays - 30) * 2, 0, 100), w: WEIGHTS.settlement,
      detail: 'averages ' + b.avgSettlementDays + ' days against ' + c.fields.termsDays + '-day terms',
    },
    {
      key: 'sme', name: 'SME standing',
      raw: c.smeVerified ? 90 : 40, w: WEIGHTS.sme,
      detail: c.smeVerified ? 'KYB verified, existing customer' : 'KYB pending, first submission',
    },
    {
      key: 'invoice', name: 'Invoice integrity',
      raw: c.checksPass ? 100 : 0, w: WEIGHTS.invoice,
      detail: c.checksPass ? 'all validation checks passed' : 'validation failed',
    },
  ].map((p) => ({ ...p, weighted: p.raw * p.w }))

  const total = parts.reduce((s, p) => s + p.weighted, 0)
  const band = total >= BANDS.low ? 'Low' : total >= BANDS.medium ? 'Medium' : 'High'

  return { parts, total, band }
}

// Mirrors FundingEngine.CreateOffer(...).
export function offerFor(amount, pct) {
  const advance = amount * pct
  const fee = advance * POLICY.feeRate
  return { advance, fee, net: advance - fee }
}
