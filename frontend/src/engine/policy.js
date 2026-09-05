// Shared with the SME-facing app. Change a number here and both sides move together.
export const WEIGHTS = { buyer: 0.55, settlement: 0.20, sme: 0.15, invoice: 0.10 }
export const BANDS = { low: 80, medium: 65 }
export const POLICY = { Low: 0.80, Medium: 0.60, High: 0, feeRate: 0.02, maxOverride: 0.85 }

// Deterministic pre-screen applied before the weighted score. See engine/rules.js.
export const RULES = {
  buyerApproveRate: 0.85,
  buyerFlagRate: 0.65,
  amountApprove: 500000,
  amountFlag: 1000000,
  absaMinMonths: 3,
}

// What an existing Absa banking relationship is worth on the offer.
export const ABSA = { advanceUplift: 0.05, feeDiscount: 0.005 }
