import { fmt, pillClass } from '../engine/format.js'

const TABS = [['awaiting', 'Queue'], ['blocked', 'Blocked'], ['decided', 'Decided']]

export default function Queue({ cases, tab, counts, selectedId, onTab, onSelect }) {
  return (
    <section className="panel">
      <div className="tabs" role="tablist">
        {TABS.map(([k, lbl]) => (
          <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => onTab(k)}>
            {lbl}<span className="cnt">{counts[k]}</span>
          </button>
        ))}
      </div>
      <div className="queue">
        {cases.length === 0 && <div className="qempty">Nothing here yet.</div>}
        {cases.map((c) => (
          <button key={c.id} className="qrow" aria-current={c.id === selectedId} onClick={() => onSelect(c.id)}>
            <span className="qtop">
              <span className="qsme">{c.sme}</span>
              <span className="qamt">{fmt(c.fields.amount)}</span>
            </span>
            <span className="qbot">
              <span className="qmeta">{c.fields.invoiceNumber} &middot; {c.buyer}</span>
              {c.status === 'blocked' ? (
                <span className="pill p-halt">Duplicate</span>
              ) : c.status === 'decided' ? (
                <span className={'pill ' + (c.decision.outcome === 'approved' ? 'p-low' : 'p-high')}>
                  {c.decision.outcome === 'approved' ? Math.round(c.decision.pct * 100) + '% funded' : 'Declined'}
                </span>
              ) : (
                <span className={'pill ' + pillClass(c.risk.band)}>{c.risk.band} &middot; {c.risk.total.toFixed(0)}</span>
              )}
            </span>
            <span className="qmeta">Submitted {c.submitted}{!c.smeVerified && ' \u00b7 KYB pending'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
