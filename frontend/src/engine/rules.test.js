import { describe, it, expect } from 'vitest'
import { CASES } from '../data/cases.js'
import { BUYERS } from '../data/buyers.js'
import { evaluateRules, pricingFor, APPROVE, REVIEW, DECLINE } from './rules.js'
import { POLICY } from './policy.js'

const byInv = (n) => CASES.find((c) => c.fields.invoiceNumber === n)
const run = (c) => evaluateRules(c, BUYERS[c.buyer])

describe('rules pre-screen', () => {
  it('auto-approves a strong buyer under the amount ceiling', () => {
    const r = run(byInv('INV-1042'))
    expect(r.outcome).toBe(APPROVE)
    expect(r.fired.map((x) => x.key)).toContain('buyer-approve')
  })

  // A flag outranks the three approve rules this invoice also satisfies.
  it('flags a buyer paying under 65% on time even when other rules approve', () => {
    const r = run(byInv('INV-2087'))
    expect(r.fired.some((x) => x.action === APPROVE)).toBe(true)
    expect(r.outcome).toBe(REVIEW)
  })

  it('flags a non-Absa SME on its first transaction', () => {
    const r = run(byInv('INV-8890'))
    expect(r.outcome).toBe(REVIEW)
    expect(r.fired.map((x) => x.key)).toContain('sme-flag')
  })

  it('declines a duplicate outright', () => {
    const r = run(CASES.find((c) => c.status === 'blocked'))
    expect(r.outcome).toBe(DECLINE)
  })
})

describe('Absa relationship benefits', () => {
  it('lifts the advance and thins the fee past the tenure threshold', () => {
    const { absa } = run(byInv('INV-1042'))
    expect(absa.qualifies).toBe(true)
    const p = pricingFor('Low', absa)
    expect(p.advanceRate).toBe(0.85)
    expect(p.feeRate).toBe(0.015)
  })

  it('withholds benefits from an Absa customer under three months', () => {
    const { absa } = run(byInv('INV-5521'))
    expect(absa.isCustomer).toBe(true)
    expect(absa.qualifies).toBe(false)
    expect(pricingFor('Medium', absa).advanceRate).toBe(POLICY.Medium)
  })

  it('never lifts an advance past the override ceiling', () => {
    const absa = { isCustomer: true, months: 24, qualifies: true }
    expect(pricingFor('Low', absa).advanceRate).toBeLessThanOrEqual(POLICY.maxOverride)
  })

  it('leaves a declined band at zero regardless of the relationship', () => {
    const absa = { isCustomer: true, months: 24, qualifies: true }
    expect(pricingFor('High', absa).advanceRate).toBe(0)
  })
})
