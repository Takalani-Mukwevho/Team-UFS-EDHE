import { useState } from 'react'
import Chevron from './Chevron.jsx'

export default function AuditTrail({ entries, overrides }) {
  const [open, setOpen] = useState(false)

  return (
    <details className="panel audit" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="phead">
        <span className="phead-l">
          <Chevron />
          <span className="eyebrow">Audit trail</span>
        </span>
        <span className="conf">{entries.length} entries &middot; {overrides} override{overrides === 1 ? '' : 's'}</span>
      </summary>
      {entries.length === 0 ? (
        <div className="aempty">No decisions recorded.</div>
      ) : (
        entries.map((a, i) => (
          <div className="arow" key={i}>
            <span className="at">{a.at}</span>
            <span className="aw">
              <span className="h">{a.inv} &middot; {a.sme}</span>
              <span className="r" style={{ display: 'block' }}>
                Engine: {a.engine} &rarr; Final: {a.final} &middot; {a.who}
                {a.reason ? ' — ' + a.reason : ''}
              </span>
            </span>
            <span className={'pill ' + (a.overridden ? 'p-med' : a.kind === 'disbursement' ? 'p-low' : 'p-neutral')}>
              {a.kind === 'disbursement' ? 'Paid' : a.overridden ? 'Override' : 'Accepted'}
            </span>
          </div>
        ))
      )}
    </details>
  )
}
