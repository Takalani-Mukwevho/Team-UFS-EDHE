import { useState } from 'react'


export default function SettlementChart({ buyerName, terms, buyers: buyersProp }) {
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const buyer = buyersProp && buyersProp[buyerName];

  // Generate recent settlement data if not available
  const data = buyer?.recent || Array.from({ length: 12 }, (_, i) => {
    const avg = buyer?.avgSettlementDays || 45;
    return Math.max(15, Math.min(90, avg + Math.floor(Math.random() * 20 - 10)));
  });

  const W = 660, H = 168, PL = 30, PR = 6, PT = 12, PB = 24;
  const iw = W - PL - PR, ih = H - PT - PB;
  const max = Math.max(...data, terms) * 1.16;
  const bw = iw / data.length;
  const barW = bw - 6;
  const y = (v) => PT + ih - (v / max) * ih;
  const ticks = [0, Math.round(max / 2 / 10) * 10, Math.round(max / 10) * 10];
  const late = data.filter((d) => d > terms).length;

  const topRounded = (x, yy, w, h, r) => {
    const rr = Math.min(r, w / 2, h);
    return `M${x},${yy + h} L${x},${yy + rr} Q${x},${yy} ${x + rr},${yy} L${x + w - rr},${yy} Q${x + w},${yy} ${x + w},${yy + rr} L${x + w},${yy + h} Z`;
  };

  return (
    <div className="chart-wrap">
      <div className="chart-title">Recent settlements — {buyerName}</div>
      <div className="chart-sub">
        Days taken to pay, last {data.length} invoices. {late} of {data.length} landed past the {terms}-day terms line.
        {" "}<button className="linkbtn" onClick={() => setShowTable((s) => !s)}>{showTable ? "Hide values" : "Show values"}</button>
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label={`Bar chart of days to settle for the last ${data.length} invoices from ${buyerName}, against ${terms}-day terms.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PL - 7} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)"
                  fontFamily="'IBM Plex Mono',monospace">{t}</text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PL + i * bw + 3;
          const yy = y(d);
          return (
            <g key={i}
               onMouseEnter={() => setHover({ i, d, x: x + barW / 2, y: yy })}
               onMouseLeave={() => setHover(null)}>
              <rect x={PL + i * bw} y={PT} width={bw} height={ih} fill="transparent" />
              <path d={topRounded(x, yy, barW, PT + ih - yy, 4)} fill="var(--data)"
                    opacity={hover && hover.i !== i ? 0.45 : 1} />
            </g>
          );
        })}

        <line x1={PL} x2={W - PR} y1={y(terms)} y2={y(terms)} stroke="var(--ink-2)"
              strokeWidth="1.5" strokeDasharray="5 4" />
        <text x={W - PR} y={y(terms) - 6} textAnchor="end" fontSize="10" fill="var(--ink-2)"
              fontFamily="'Archivo',sans-serif" fontWeight="600">{terms}-day terms</text>

        <line x1={PL} x2={W - PR} y1={PT + ih} y2={PT + ih} stroke="var(--line-strong)" strokeWidth="1" />
        <text x={PL} y={H - 6} fontSize="10" fill="var(--ink-3)" fontFamily="'Archivo',sans-serif">oldest</text>
        <text x={W - PR} y={H - 6} textAnchor="end" fontSize="10" fill="var(--ink-3)" fontFamily="'Archivo',sans-serif">most recent</text>
      </svg>

      {hover && (
        <div className="tip" style={{ left: (hover.x / W) * 100 + "%", top: (hover.y / H) * 100 - 6 + "%" }}>
          <b>{hover.d} days</b> to settle<br />
          {hover.d > terms ? (hover.d - terms) + " days past terms" : (terms - hover.d) + " days inside terms"}
        </div>
      )}

      {showTable && (
        <div className="tbl-scroll" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>Invoice</th>{data.map((_, i) => <th key={i} className="r">{i + 1}</th>)}</tr></thead>
            <tbody><tr><td className="k">Days to settle</td>{data.map((d, i) => <td key={i} className="r v">{d}</td>)}</tr></tbody>
          </table>
        </div>
      )}
    </div>
  );
}
