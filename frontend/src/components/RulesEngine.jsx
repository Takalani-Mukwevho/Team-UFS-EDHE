import { APPROVE, REVIEW, DECLINE } from "../engine/rules";
import { RULES, ABSA } from "../engine/policy";

const OUTCOME = {
  [APPROVE]: { chip: "bg-tertiary-container text-on-tertiary", icon: "bolt", line: "No human touch — this invoice funds straight through." },
  [REVIEW]: { chip: "bg-secondary-container text-on-secondary-container", icon: "flag", line: "Routed to the credit desk. An analyst confirms before any cash moves." },
  [DECLINE]: { chip: "bg-error-container text-on-error-container", icon: "block", line: "Stopped at verification. No advance is made against this invoice." },
};

const ACTION_TEXT = {
  [APPROVE]: "text-tertiary",
  [REVIEW]: "text-on-surface",
  [DECLINE]: "text-error",
};

export default function RulesEngine({ result }) {
  const { outcome, rules, absa } = result;
  const style = OUTCOME[outcome];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm">
        <div className="flex flex-col gap-space-3xs">
          <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Rules engine</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl">
            Before the weighted score runs, the invoice is checked against fixed policy rules.
            Most invoices settle here without a human ever opening them.
          </p>
        </div>
        <span className={`inline-flex items-center gap-space-2xs px-space-sm py-space-3xs rounded-full font-label-caps text-label-caps uppercase tracking-wider font-semibold shadow-sm shrink-0 ${style.chip}`}>
          <span className="material-symbols-outlined text-[1rem]">{style.icon}</span>
          {outcome}
        </span>
      </div>

      <p className="font-body-md text-body-md text-on-surface">{style.line}</p>

      {absa.isCustomer && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs p-space-md rounded-lg ${absa.qualifies ? "bg-tertiary-container/20" : "bg-surface-container-low"}`}>
          <div className="flex items-center gap-space-sm">
            <span className={`material-symbols-outlined text-[1.25rem] ${absa.qualifies ? "text-tertiary" : "text-on-surface-variant"}`}>
              {absa.qualifies ? "workspace_premium" : "hourglass_top"}
            </span>
            <div className="flex flex-col">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                {absa.qualifies ? "Absa relationship benefits applied" : "Absa customer — benefits not yet unlocked"}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {absa.months} months of banking history
                {absa.qualifies
                  ? ` — past the ${RULES.absaMinMonths}-month threshold`
                  : ` — ${RULES.absaMinMonths - absa.months} more month${RULES.absaMinMonths - absa.months === 1 ? "" : "s"} to qualify`}
              </span>
            </div>
          </div>
          {absa.qualifies && (
            <div className="flex flex-wrap items-center gap-space-xs shrink-0">
              <span className="px-space-xs py-space-3xs rounded-full bg-surface-container-lowest font-mono-data-cell text-mono-data-cell text-tertiary font-semibold">
                +{Math.round(ABSA.advanceUplift * 100)}% advance
              </span>
              <span className="px-space-xs py-space-3xs rounded-full bg-surface-container-lowest font-mono-data-cell text-mono-data-cell text-tertiary font-semibold">
                −{+(ABSA.feeDiscount * 100).toFixed(2)}% fee
              </span>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto -mx-space-2xs">
        <table className="w-full min-w-[34rem] border-collapse">
          <thead>
            <tr className="text-left font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="py-space-2xs px-space-2xs font-semibold">Rule</th>
              <th className="py-space-2xs px-space-2xs font-semibold">Condition</th>
              <th className="py-space-2xs px-space-2xs font-semibold">Action</th>
              <th className="py-space-2xs px-space-2xs font-semibold text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.key} className={`border-t border-outline-variant/40 ${r.fired ? "bg-surface-container-low" : ""}`}>
                <td className="py-space-xs px-space-2xs align-top">
                  <span className={`font-body-sm text-body-sm ${r.fired ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>{r.rule}</span>
                </td>
                <td className="py-space-xs px-space-2xs align-top">
                  <span className={`font-body-sm text-body-sm block ${r.fired ? "text-on-surface" : "text-on-surface-variant"}`}>{r.condition}</span>
                  {r.fired && <span className="font-body-sm text-body-sm text-on-surface-variant block mt-space-3xs">{r.detail}</span>}
                </td>
                <td className="py-space-xs px-space-2xs align-top">
                  <span className={`font-body-sm text-body-sm ${r.fired ? `${ACTION_TEXT[r.action]} font-semibold` : "text-on-surface-variant"}`}>{r.action}</span>
                </td>
                <td className="py-space-xs px-space-2xs align-top text-right whitespace-nowrap">
                  {r.fired ? (
                    <span className="inline-flex items-center gap-space-3xs font-label-caps text-label-caps uppercase font-bold text-on-surface">
                      <span className="material-symbols-outlined text-[1rem]">check_circle</span>Triggered
                    </span>
                  ) : (
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Not met</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row gap-space-sm">
        <div className="flex-1 p-space-md rounded-lg bg-surface-container-low flex flex-col">
          <span className="font-headline-md text-headline-md font-bold text-tertiary tracking-tight">80–90%</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">auto-approved — no human touch</span>
        </div>
        <div className="flex-1 p-space-md rounded-lg bg-surface-container-low flex flex-col">
          <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">10–20%</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">flagged for review — only exceptions need humans</span>
        </div>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Illustrative thresholds on fictional data. Throughput figures are modelled, not measured.
      </p>
    </div>
  );
}
