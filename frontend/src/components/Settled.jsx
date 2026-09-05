import Section from './Section.jsx'
import { fmt, fmt2 } from '../engine/format.js'
import { disbursementOf } from '../engine/decision.js'

function fmtAccepted(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

export default function Settled({ c }) {
  const d = c.decision;
  const dis = disbursementOf(c);
  const paid = d?.outcome === 'approved' && !!dis;
  return (
    <Section title="Decision">
      <div className={"settled " + (d.outcome === "approved" ? "ok" : "no")}>
        <div>
          <div className="settled-k">
            {d.outcome === "approved"
              ? paid
                ? "Paid — SME accepted the advance"
                : "Approved at " + Math.round(d.pct * 100) + "% — awaiting SME acceptance"
              : "Declined"}
          </div>
          <div className="settled-t">
            {d.outcome === "approved" && paid
              ? c.sme + " accepted the advance of " + fmt(dis.advance) + " (fee " + fmt2(dis.fee) + ") on " +
                fmtAccepted(dis.acceptedAt) + ". Net of " + fmt2(dis.net) + " paid against " + fmt(c.fields.amount) +
                " due " + c.fields.dueDate + "."
              : d.outcome === "approved"
                ? fmt2(d.offer.net) + " approved for release to " + c.sme + " against " + fmt(c.fields.amount) +
                  " due " + c.fields.dueDate + ". No funds have moved yet — the amount paid will appear here once the SME accepts the offer on its portal."
                : "No advance made against " + c.fields.invoiceNumber + "."}
          </div>
          {d.overridden && <div className="settled-t" style={{ marginTop: 8 }}><strong>Override reason:</strong> {d.reason}</div>}
          <div className="settled-meta">
            Invoice Finance Desk &middot; {d.at} &middot; engine: {d.engineLine.toLowerCase()}
            {d.overridden ? " · OVERRIDDEN" : " · accepted"}
            {paid && " · disbursed " + fmtAccepted(dis.acceptedAt)}
          </div>
        </div>
      </div>
    </Section>
  );
}
