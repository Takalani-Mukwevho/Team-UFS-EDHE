import { ANALYST } from '../data/cases.js'

export default function Masthead() {
  return (
    <header className="masthead">
      <div>
        <div className="brand-row">
          <span className="mark">A</span>
          <span className="wordmark">AbsaFlow</span>
          <span className="divider-v" />
          <span className="deskname">Credit Desk &mdash; Invoice Finance</span>
          <span className="badge-proto">Prototype</span>
        </div>
      </div>
      <div className="analyst">
        <span className="avatar">{ANALYST.initials}</span>
        <span>
          <span className="nm" style={{ display: 'block' }}>{ANALYST.name}</span>
          <span className="rl">{ANALYST.role}</span>
        </span>
      </div>
    </header>
  )
}
