export default function Section({ title, right, children }) {
  return (
    <div className="sec">
      <div className="sec-head">
        <span className="eyebrow">{title}</span>
        {right || null}
      </div>
      <div className="sec-body">{children}</div>
    </div>
  )
}
