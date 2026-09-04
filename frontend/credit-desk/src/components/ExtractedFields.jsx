import Section from './Section.jsx'
import { fmt } from '../engine/format.js'

export default function ExtractedFields({ c }) {
  const f = c.fields, conf = c.confidence;
  const rows = [
    ["Invoice number", f.invoiceNumber, conf.invoiceNumber],
    ["Supplier", c.sme, conf.supplier],
    ["Buyer", c.buyer, conf.buyer],
    ["Invoice amount", fmt(f.amount), conf.amount],
    ["Issue date", f.issueDate, conf.issueDate],
    ["Due date", f.dueDate, conf.dueDate],
    ["Payment terms", f.termsDays + " days", conf.termsDays],
  ];
  const vals = Object.values(conf);
  const low = vals.filter((v) => v < 92).length;
  return (
    <Section title="Extracted fields" collapsible defaultOpen={false}
      right={<span className="conf">{low > 0 ? low + " field" + (low > 1 ? "s" : "") + " below 92% — check the document" : "all fields above 92%"}</span>}>
      <div className="tbl-scroll">
        <table>
          <thead><tr><th>Field</th><th>Value</th><th className="r">Confidence</th></tr></thead>
          <tbody>
            {rows.map(([k, v, cf]) => (
              <tr key={k} className={cf < 92 ? "flagrow" : ""}>
                <td className="k">{k}</td>
                <td className="v">{v}</td>
                <td className="r"><span className={"conf" + (cf < 92 ? " lowc" : "")}>{cf.toFixed(1)}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
