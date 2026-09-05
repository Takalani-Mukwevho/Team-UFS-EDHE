import { useState, useMemo, useCallback, Fragment, useEffect, useRef } from 'react'
import { scoreCase } from '../engine/scoring.js'
import { fmt, fmt2 } from '../engine/format.js'
import { disbursementOf } from '../engine/decision.js'
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
import AuditTrail from '../components/AuditTrail.jsx'

export default function BankingDashboard() {
  const { invoices: apiCases, buyers, loading, dataSource, refetch } = useApiData()
  const [cases, setCases] = useState([])
  const [selectedId, setSelectedId] = useState('c1')
  const [decisions, setDecisions] = useState({})
  const [audit, setAudit] = useState([])

  // Keep the queue in step with the shared DynamoDB ledger so invoices that are
  // verified and awaiting approval on the SME side show up here without a manual
  // refresh.
  useEffect(() => {
    const id = setInterval(() => refetch(), 6000)
    return () => clearInterval(id)
  }, [refetch])

  // Merge the live ledger with any decisions made in this session (a refetch
  // would otherwise show them as awaiting again) and keep the selection stable.
  useEffect(() => {
    if (apiCases.length === 0) return
    const merged = apiCases.map((c) =>
      decisions[c.id] ? { ...c, status: 'decided', decision: decisions[c.id] } : c
    )
    setCases(merged)
    setSelectedId((cur) => (apiCases.some((c) => c.id === cur) ? cur : apiCases[0]?.id || 'c1'))
  }, [apiCases, decisions])

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

  // Disbursements only happen once the SME accepts the advance on its portal —
  // these are the actual sums paid, separate from the desk's approvals above.
  const disbursedCases = withRisk.filter((c) => !!disbursementOf(c))
  const paidTotal = disbursedCases.reduce((s, c) => s + (disbursementOf(c)?.net || 0), 0)
  const paidCount = disbursedCases.length

  const overrides = audit.filter((a) => a.overridden).length

  const decide = useCallback((c, d) => {
    const at = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    const newDecision = { ...d, at };
    setDecisions((prev) => ({ ...prev, [c.id]: newDecision }))
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

  // Log each SME acceptance to the audit trail once, as the ledger overlay or
  // polling brings the disbursement record back to this console.
  const loggedDisbursements = useRef({})
  useEffect(() => {
    withRisk.forEach((c) => {
      const dis = disbursementOf(c)
      if (!dis) return
      const key = (c.raw?.invoiceId || c.id) + '|' + (dis.acceptedAt || '')
      if (loggedDisbursements.current[key]) return
      loggedDisbursements.current[key] = true
      const paidAt = dis.acceptedAt
        ? new Date(dis.acceptedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
      setAudit((prev) => [{
        kind: 'disbursement',
        at: 'Today ' + paidAt,
        who: 'SME · self-service acceptance',
        inv: c.fields?.invoiceNumber,
        sme: c.sme,
        engine: 'SME accepted the advance',
        final: 'Paid ' + fmt2(dis.net) + ' (net of fee ' + fmt2(dis.fee) + ')',
        overridden: false,
      }].concat(prev))
    })
  }, [withRisk])

  if (loading && cases.length === 0) {
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
        paidTotal={paidTotal} paidCount={paidCount}
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
            {selected.status === 'decided'
              ? <Settled c={selected} />
              : <DecisionSection c={selected} risk={selected.risk} onDecide={(d) => decide(selected, d)} buyers={buyers} />}
          </Fragment>
        )}
      </section>

      <AuditTrail entries={audit} overrides={overrides} />

      <p className="footnote">
        Shifa prototype. Data loaded from AWS DynamoDB. Advance rates, fee rates and
        risk weights are determined by the scoring engine. Commercial terms in a real deployment
        would be set by the bank.
      </p>
    </div>
  )
}
