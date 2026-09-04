import { describe, it, expect } from 'vitest'
import { CASES } from '../data/cases.js'
import { scoreCase, offerFor } from './scoring.js'
import { POLICY } from './policy.js'

const byInv = (n) => CASES.find((c) => c.fields.invoiceNumber === n)

describe('scoring across the queue', () => {
  it('puts the reliable buyer in the Low band', () => {
    const r = scoreCase(byInv('INV-1042'))
    expect(r.band).toBe('Low')
    expect(r.total).toBeCloseTo(96.3, 1)
  })

  it('puts the late-paying buyer in the High band', () => {
    const r = scoreCase(byInv('INV-2087'))
    expect(r.band).toBe('High')
    expect(POLICY[r.band]).toBe(0)
  })

  it('drops an unverified SME a band', () => {
    const c = byInv('INV-8890')
    expect(c.smeVerified).toBe(false)
    const asIs = scoreCase(c)
    const ifVerified = scoreCase({ ...c, smeVerified: true })
    expect(ifVerified.total).toBeGreaterThan(asIs.total)
    expect(asIs.band).toBe('Medium')
  })

  // The duplicate is a copy of INV-1042: same excellent buyer, same clean document.
  // It still scores well even with the integrity component zeroed, which is exactly
  // why verification has to stop it. A good score is not a licence to fund twice.
  it('stops the duplicate at verification, not at scoring', () => {
    const c = CASES.find((x) => x.status === 'blocked')
    expect(c.checksPass).toBe(false)
    expect(scoreCase(c).band).toBe('Low')
    expect(c.status).toBe('blocked')
  })
})

describe('offer arithmetic', () => {
  it('nets R145,040 on an 80% advance against R185,000', () => {
    const o = offerFor(185000, 0.8)
    expect(o.advance).toBe(148000)
    expect(o.fee).toBe(2960)
    expect(o.net).toBe(145040)
  })

  it('never exceeds the override ceiling', () => {
    expect(POLICY.maxOverride).toBeLessThanOrEqual(0.9)
  })
})
