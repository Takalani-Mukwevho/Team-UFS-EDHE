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
        <span className="avatar">IF</span>
        <span>
          <span className="nm" style={{ display: 'block' }}>Invoice Finance Desk</span>
          <span className="rl">AbsaFlow System</span>
        </span>
      </div>
    </header>
  )
}
