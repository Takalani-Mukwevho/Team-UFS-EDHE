import Section from './Section.jsx'
import { BANDS } from '../engine/policy.js'
import { pillClass } from '../engine/format.js'

export default function RiskSection({ risk }) {
  return (
    <Section title="Invoice funding risk">
      <div className="risk-top">
        <span className="score">{risk.total.toFixed(1)}<small> / 100</small></span>
        <span className={"pill " + pillClass(risk.band)}>{risk.band} risk</span>
        <span className="risk-note">Bands: Low &ge; {BANDS.low}, Medium &ge; {BANDS.medium}, otherwise High.</span>
      </div>
      {risk.parts.map((p) => (
        <div className="comp" key={p.key}>
          <div className="comp-row">
            <span className="comp-name">{p.name} <span style={{ color: "var(--ink-3)" }}>&middot; {p.detail}</span></span>
            <span className="comp-math">{p.raw.toFixed(0)} &times; {p.w.toFixed(2)} = <b>{p.weighted.toFixed(1)}</b></span>
          </div>
          <div className="track"><div className="fill" style={{ width: p.raw + "%" }} /></div>
        </div>
      ))}
    </Section>
  );
}
