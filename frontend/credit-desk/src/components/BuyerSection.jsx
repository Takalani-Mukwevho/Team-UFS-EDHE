import Section from './Section.jsx'
import SettlementChart from './SettlementChart.jsx'
import { BUYERS } from '../data/buyers.js'

export default function BuyerSection({ c }) {
  const b = BUYERS[c.buyer];
  return (
    <Section title="Buyer and settlement history" collapsible defaultOpen={false}
      right={<span className="conf">{b.sector} &middot; {Math.round(b.onTimeRate * 100)}% on time &middot; {b.avgSettlementDays}d avg</span>}>
      <div className="buyer-grid">
        <div><div className="bl">Settled invoices</div><div className="bv">{b.historicalInvoices}</div></div>
        <div><div className="bl">Paid on time</div><div className="bv">{Math.round(b.onTimeRate * 100)}%</div></div>
        <div><div className="bl">Avg settlement</div><div className="bv">{b.avgSettlementDays}d</div></div>
        <div><div className="bl">Against terms</div><div className="bv">{Math.abs(b.avgSettlementDays - c.fields.termsDays)}d <span style={{ fontSize: 11, fontFamily: "'Archivo',sans-serif", color: b.avgSettlementDays > c.fields.termsDays ? "var(--warn)" : "var(--good)" }}>{b.avgSettlementDays > c.fields.termsDays ? "late" : "early"}</span></div></div>
      </div>
      <SettlementChart buyerName={c.buyer} terms={c.fields.termsDays} />
    </Section>
  );
}
