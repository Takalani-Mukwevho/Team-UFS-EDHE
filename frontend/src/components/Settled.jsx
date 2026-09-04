import Section from './Section.jsx'
import { ANALYST } from '../data/cases.js'
import { fmt, fmt2 } from '../engine/format.js'

export default function Settled({ c }) {
  const d = c.decision;
  return (
    <Section title="Decision">
      <div className={"settled " + (d.outcome === "approved" ? "ok" : "no")}>
        <div>
          <div className="settled-k">{d.outcome === "approved" ? "Approved at " + Math.round(d.pct * 100) + "%" : "Declined"}</div>
          <div className="settled-t">
            {d.outcome === "approved"
              ? fmt2(d.offer.net) + " released to " + c.sme + " against " + fmt(c.fields.amount) + " due " + c.fields.dueDate + "."
              : "No advance made against " + c.fields.invoiceNumber + "."}
          </div>
          {d.overridden && <div className="settled-t" style={{ marginTop: 8 }}><strong>Override reason:</strong> {d.reason}</div>}
          <div className="settled-meta">
            {ANALYST.name} &middot; {d.at} &middot; engine: {d.engineLine.toLowerCase()}
            {d.overridden ? " · OVERRIDDEN" : " · accepted"}
          </div>
        </div>
      </div>
    </Section>
  );
}
