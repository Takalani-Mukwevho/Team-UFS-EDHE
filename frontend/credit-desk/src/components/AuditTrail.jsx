export default function AuditTrail({ entries, overrides }) {
  return (
    <section className="panel audit">
      <div className="phead">
        <span className="eyebrow">Audit trail</span>
        <span className="conf">{entries.length} entries &middot; {overrides} override{overrides === 1 ? '' : 's'}</span>
      </div>
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
                {a.reason ? ' \u2014 ' + a.reason : ''}
              </span>
            </span>
            <span className={'pill ' + (a.overridden ? 'p-med' : 'p-neutral')}>
              {a.overridden ? 'Override' : 'Accepted'}
            </span>
          </div>
        ))
      )}
    </section>
  )
}
