import { fmt } from '../engine/format.js'

export default function MetricStrip({ counts, advanced, exposure, overrides, fundedCount }) {
  return (
    <div className="strip">
      <div className="metric">
        <span className="ml">Awaiting decision</span>
        <span className="mv">{counts.awaiting}</span>
        <span className="mn">{counts.blocked} blocked at verification</span>
      </div>
      <div className="metric">
        <span className="ml">Advanced this session</span>
        <span className="mv">{fmt(advanced)}</span>
        <span className="mn">{fundedCount} invoice{fundedCount === 1 ? '' : 's'} funded</span>
      </div>
      <div className="metric">
        <span className="ml">Live exposure</span>
        <span className="mv">{fmt(exposure)}</span>
        <span className="mn">advanced, awaiting buyer settlement</span>
      </div>
      <div className="metric">
        <span className="ml">Overrides on record</span>
        <span className="mv">{overrides}</span>
        <span className="mn">each carries a written reason</span>
      </div>
    </div>
  )
}
