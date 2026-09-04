import { useState } from 'react'
import Chevron from './Chevron.jsx'

export default function Section({ title, right, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  if (!collapsible) {
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

  return (
    <details className="sec sec-fold" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="sec-head">
        <span className="sec-head-l">
          <Chevron />
          <span className="eyebrow">{title}</span>
        </span>
        {right || null}
      </summary>
      <div className="sec-body">{children}</div>
    </details>
  )
}
