import { RULES, POLICY, ABSA } from './policy.js'

export const APPROVE = 'Auto-approve'
export const REVIEW = 'Flag for review'
export const DECLINE = 'Auto-decline'

const pct = (n) => Math.round(n * 100) + '%'
const rands = (n) => 'R' + n.toLocaleString('en-ZA')

// Demo invoices carry the banking relationship directly. API records only tell us
// whether the SME passed KYB, so tenure falls back to how long it has traded.
function relationship(invoice, sme) {
  const months = invoice.absaMonths ?? (sme?.yearsInOperation ? sme.yearsInOperation * 12 : 0)
  const isCustomer = invoice.absaCustomer ?? Boolean(sme?.isVerified)
  return { isCustomer, months, qualifies: isCustomer && months >= RULES.absaMinMonths }
}

// Mirrors the rule table in RiskEngineService. A decline beats a flag, a flag beats
// an approve — one bad signal is enough to take an invoice off the automated path.
export function evaluateRules(invoice, buyer, sme) {
  const absa = relationship(invoice, sme)
  const amount = invoice.fields.amount
  const onTime = buyer?.onTimeRate ?? 0
  const priorFundings = invoice.priorFundings ?? (invoice.smeVerified ? 1 : 0)

  const rules = [
    {
      key: 'buyer-approve', rule: 'Buyer risk', action: APPROVE,
      condition: `Buyer has ${pct(RULES.buyerApproveRate)}+ on-time payments`,
      fired: Boolean(buyer) && onTime >= RULES.buyerApproveRate,
      detail: buyer
        ? `${invoice.buyer} settles ${pct(onTime)} of ${buyer.historicalInvoices} tracked invoices on time`
        : 'No settlement history for this buyer',
    },
    {
      key: 'amount-approve', rule: 'Invoice amount', action: APPROVE,
      condition: `Below ${rands(RULES.amountApprove)}`,
      fired: amount < RULES.amountApprove,
      detail: `${rands(amount)} sits ${amount < RULES.amountApprove ? 'inside' : 'above'} the automated ceiling`,
    },
    {
      key: 'sme-approve', rule: 'SME history', action: APPROVE,
      condition: `Absa customer with ${RULES.absaMinMonths}+ months history`,
      fired: absa.qualifies,
      detail: absa.isCustomer
        ? `Absa commercial customer, ${absa.months} months of banking history`
        : 'Not banking with Absa',
    },
    {
      key: 'duplicate', rule: 'Duplicate', action: DECLINE,
      condition: 'Invoice already submitted',
      fired: invoice.checksPass === false,
      detail: invoice.checksPass === false
        ? invoice.dupNote || 'Matches an invoice already on the ledger'
        : 'No ledger match',
    },
    {
      key: 'buyer-flag', rule: 'Buyer risk', action: REVIEW,
      condition: `Buyer has under ${pct(RULES.buyerFlagRate)} on-time payments`,
      fired: !buyer || onTime < RULES.buyerFlagRate,
      detail: buyer
        ? `${pct(onTime)} on time, averaging ${buyer.avgSettlementDays} days`
        : 'Buyer is not in the settlement dataset',
    },
    {
      key: 'amount-flag', rule: 'Invoice amount', action: REVIEW,
      condition: `Above ${rands(RULES.amountFlag)}`,
      fired: amount > RULES.amountFlag,
      detail: `${rands(amount)} against a ${rands(RULES.amountFlag)} review threshold`,
    },
    {
      key: 'sme-flag', rule: 'SME history', action: REVIEW,
      condition: 'Non-Absa user, first transaction',
      fired: !absa.isCustomer && priorFundings === 0,
      detail: absa.isCustomer
        ? 'Existing Absa relationship on file'
        : `No Absa relationship, ${priorFundings} prior advances`,
    },
  ]

  const fired = rules.filter((r) => r.fired)
  const outcome =
    fired.some((r) => r.action === DECLINE) ? DECLINE
    : fired.some((r) => r.action === REVIEW) ? REVIEW
    : fired.some((r) => r.action === APPROVE) ? APPROVE
    : REVIEW

  return { outcome, rules, fired, absa }
}

// Absa customers price better: a higher advance ceiling and a thinner discount fee.
export function pricingFor(band, absa) {
  const baseRate = POLICY[band] || 0
  const advanceRate = baseRate > 0 && absa.qualifies
    ? Math.min(baseRate + ABSA.advanceUplift, POLICY.maxOverride)
    : baseRate
  const feeRate = absa.qualifies ? POLICY.feeRate - ABSA.feeDiscount : POLICY.feeRate
  return { baseRate, advanceRate, feeRate, uplift: advanceRate - baseRate, feeSaving: POLICY.feeRate - feeRate }
}
