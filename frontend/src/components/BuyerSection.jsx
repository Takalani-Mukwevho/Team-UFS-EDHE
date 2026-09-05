import Section from './Section.jsx'
import SettlementChart from './SettlementChart.jsx'


export default function BuyerSection({ c, buyers: buyersProp }) {
  const b = buyersProp && buyersProp[c.buyer];

  if (!b) {
    return (
      <Section title="Buyer and settlement history" collapsible defaultOpen={false}>
        <div className="buyer-grid">
          <div><div className="bl">Buyer</div><div className="bv">{c.buyer}</div></div>
          <div><div className="bl">Status</div><div className="bv">Data loading...</div></div>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Buyer and settlement history" collapsible defaultOpen={false}
      right={<span className="conf">{b.sector || 'N/A'} &middot; {Math.round((b.onTimeRate || 0) * 100)}% on time &middot; {b.avgSettlementDays || 0}d avg</span>}>
      <div className="buyer-grid">
        <div><div className="bl">Settled invoices</div><div className="bv">{b.historicalInvoices || 0}</div></div>
        <div><div className="bl">Paid on time</div><div className="bv">{Math.round((b.onTimeRate || 0) * 100)}%</div></div>
        <div><div className="bl">Avg settlement</div><div className="bv">{b.avgSettlementDays || 0}d</div></div>
        <div><div className="bl">Against terms</div><div className="bv">{Math.abs((b.avgSettlementDays || 0) - c.fields.termsDays)}d <span style={{ fontSize: 11, fontFamily: "'Archivo',sans-serif", color: (b.avgSettlementDays || 0) > c.fields.termsDays ? "var(--warn)" : "var(--good)" }}>{(b.avgSettlementDays || 0) > c.fields.termsDays ? "late" : "early"}</span></div></div>
      </div>
      <SettlementChart buyerName={c.buyer} terms={c.fields.termsDays} buyers={buyersProp} />
    </Section>
  );
}
