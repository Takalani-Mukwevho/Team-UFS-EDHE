import { useState, useMemo, useCallback, Fragment } from 'react'
import { CASES, SEED_AUDIT, ANALYST } from './data/cases.js'
import { scoreCase } from './engine/scoring.js'
import { fmt } from './engine/format.js'

import Masthead from './components/Masthead.jsx'
import MetricStrip from './components/MetricStrip.jsx'
import InvoicePicker from './components/InvoicePicker.jsx'
import Section from './components/Section.jsx'
import ExtractedFields from './components/ExtractedFields.jsx'
import Checks from './components/Checks.jsx'
import BuyerSection from './components/BuyerSection.jsx'
import RiskSection from './components/RiskSection.jsx'
import DecisionSection from './components/DecisionSection.jsx'
import Settled from './components/Settled.jsx'
import AuditTrail from './components/AuditTrail.jsx'

export default function App() {
  const [cases, setCases] = useState(CASES)
  const [selectedId, setSelectedId] = useState('c1')
  const [audit, setAudit] = useState(SEED_AUDIT)

  const withRisk = useMemo(() => cases.map((c) => ({ ...c, risk: scoreCase(c) })), [cases])
  const selected = withRisk.find((c) => c.id === selectedId) || withRisk[0]

  const counts = {
    awaiting: withRisk.filter((c) => c.status === 'awaiting').length,
    blocked: withRisk.filter((c) => c.status === 'blocked').length,
    decided: withRisk.filter((c) => c.status === 'decided').length,
  }

  const funded = withRisk.filter((c) => c.status === 'decided' && c.decision.outcome === 'approved')
  const advanced = funded.reduce((s, c) => s + c.decision.offer.net, 0)
  const exposure = funded.reduce((s, c) => s + c.decision.offer.advance, 0)
  const overrides = audit.filter((a) => a.overridden).length

  const decide = useCallback((c, d) => {
    const at = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: 'decided', decision: { ...d, at } } : x)))
    setAudit((prev) => [{
      at: 'Today ' + at, who: ANALYST.name, inv: c.fields.invoiceNumber, sme: c.sme,
      engine: d.engineLine, final: d.finalLine, overridden: d.overridden, reason: d.reason,
    }].concat(prev))
  }, [])

  return (
    <Fragment>
      <Masthead />
      <MetricStrip
        counts={counts} advanced={advanced} exposure={exposure}
        overrides={overrides} fundedCount={funded.length}
      />

      <section className="panel">
        <div className="case-head">
          <div className="case-head-main">
            <InvoicePicker cases={withRisk} selected={selected} onSelect={setSelectedId} />
            <div className="case-sub">
              Buyer: {selected.buyer} &middot; submitted {selected.submitted} &middot; due {selected.fields.dueDate}
              {' '}&middot; {selected.fields.termsDays}-day terms
              {!selected.smeVerified && ' · KYB pending'}
            </div>
          </div>
          <div className="case-amt">
            <span className="v">{fmt(selected.fields.amount)}</span>
            <span className="l">invoice value</span>
          </div>
        </div>

        {selected.status === 'blocked' ? (
          <Fragment>
            <Section title="Blocked at verification">
              <div className="rec decline">
                <div>
                  <div className="rec-k">Duplicate submission</div>
                  <div className="rec-t">
                    {selected.fields.invoiceNumber} from {selected.sme} for {fmt(selected.fields.amount)} is already on
                    the submitted ledger ({selected.dupNote}). The pipeline stopped before scoring, so no advance can be
                    made twice against the same debt. No analyst decision is required.
                  </div>
                </div>
              </div>
            </Section>
            <Checks c={selected} />
          </Fragment>
        ) : (
          <Fragment>
            <ExtractedFields c={selected} />
            <Checks c={selected} />
            <BuyerSection c={selected} />
            <RiskSection risk={selected.risk} />
            {selected.status === 'decided'
              ? <Settled c={selected} />
              : <DecisionSection c={selected} risk={selected.risk} onDecide={(d) => decide(selected, d)} />}
          </Fragment>
        )}
      </section>

      <AuditTrail entries={audit} overrides={overrides} />

      <p className="footnote">
        Hackathon prototype. SMEs, buyers, invoices and settlement histories are fictional. Advance rates, fee rates and
        risk weights are illustrative and set for the demo; commercial terms in a real deployment would be determined by
        the bank. The scoring engine here is identical to the one behind the SME-facing app.
      </p>
    </Fragment>
  )
}
