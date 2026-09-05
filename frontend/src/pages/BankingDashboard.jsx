import { useState, useMemo, useCallback, Fragment, useEffect } from 'react'
import { scoreCase } from '../engine/scoring.js'
import { fmt } from '../engine/format.js'
import { useApiData } from '../services/useApiData.js'
import { updateInvoiceStatus } from '../services/api.js'

import Masthead from '../components/Masthead.jsx'
import MetricStrip from '../components/MetricStrip.jsx'
import InvoicePicker from '../components/InvoicePicker.jsx'
import Section from '../components/Section.jsx'
import ExtractedFields from '../components/ExtractedFields.jsx'
import Checks from '../components/Checks.jsx'
import BuyerSection from '../components/BuyerSection.jsx'
import RiskSection from '../components/RiskSection.jsx'
import DecisionSection from '../components/DecisionSection.jsx'
import Settled from '../components/Settled.jsx'
import AiInsightPanel from '../components/AiInsightPanel.jsx'
import AuditTrail from '../components/AuditTrail.jsx'

export default function BankingDashboard() {
  const { invoices: apiCases, buyers, loading, dataSource } = useApiData()
  const [cases, setCases] = useState([])
  const [selectedId, setSelectedId] = useState('c1')
  const [audit, setAudit] = useState([])

  // Initialize cases from API data when available
  useEffect(() => {
    if (apiCases.length > 0) {
      setCases(apiCases)
      setSelectedId(apiCases[0]?.id || 'c1')
    }
  }, [apiCases])

  const withRisk = useMemo(() => cases.map((c) => ({ ...c, risk: scoreCase(c, buyers) })), [cases, buyers])
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
    const newDecision = { ...d, at };
    setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: 'decided', decision: newDecision } : x)))
    setAudit((prev) => [{
      at: 'Today ' + at, who: 'Invoice Finance Desk', inv: c.fields.invoiceNumber, sme: c.sme,
      engine: d.engineLine, final: d.finalLine, overridden: d.overridden, reason: d.reason,
    }].concat(prev))
    // Persist decision to DynamoDB so it survives refresh
    const dynamoStatus = d.outcome === 'approved' ? 'Funded' : 'Rejected';
    updateInvoiceStatus(c.raw?.invoiceId || c.id, dynamoStatus, newDecision).catch((err) => {
      console.error('Failed to persist decision:', err);
    });
  }, [])

  if (loading) {
    return (
      <div className="wrap">
        <Masthead />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-on-surface-variant">Loading invoice data from API...</p>
            <p className="text-sm text-on-surface-variant/60">Data source: {dataSource === 'api' ? 'AWS DynamoDB' : 'Mock data'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="wrap">
        <Masthead />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-[3rem] text-on-surface-variant">inbox</span>
            <p className="text-on-surface-variant font-semibold">No invoices found</p>
            <p className="text-sm text-on-surface-variant/60">Data source: {dataSource}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
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
            <BuyerSection c={selected} buyers={buyers} />
            <RiskSection risk={selected.risk} />
            <AiInsightPanel selected={selected} risk={selected.risk} buyers={buyers} />
            {selected.status === 'decided'
              ? <Settled c={selected} />
              : <DecisionSection c={selected} risk={selected.risk} onDecide={(d) => decide(selected, d)} buyers={buyers} />}
          </Fragment>
        )}
      </section>

      <AuditTrail entries={audit} overrides={overrides} />

      <p className="footnote">
        SHIFA prototype. Data loaded from AWS DynamoDB. Advance rates, fee rates and
        risk weights are determined by the scoring engine. Commercial terms in a real deployment
        would be set by the bank.
      </p>
    </div>
  )
}
