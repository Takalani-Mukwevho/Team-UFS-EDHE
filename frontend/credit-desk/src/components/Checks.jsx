import Section from './Section.jsx'
import { mkChecks } from '../data/cases.js'

export default function Checks({ c }) {
  const checks = mkChecks(c.checksPass, c.dupNote);
  const passed = checks.filter((x) => x.pass).length;
  return (
    <Section title="Verification" right={<span className="conf">{passed} / {checks.length} passed</span>}>
      <div className="checks">
        {checks.map((x) => (
          <div className="check" key={x.name}>
            <span className={"tick " + (x.pass ? "ok" : "no")}>{x.pass ? "✓" : "✕"}</span>
            <span>{x.name}</span>
            <span className="check-note">{x.note}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
