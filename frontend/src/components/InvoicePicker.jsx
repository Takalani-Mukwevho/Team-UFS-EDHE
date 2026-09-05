import { useState, useRef, useEffect } from 'react'
import Chevron from './Chevron.jsx'
import { fmt, pillClass } from '../engine/format.js'
import { disbursementOf } from '../engine/decision.js'

const GROUPS = [
  ['awaiting', 'Awaiting decision'],
  ['blocked', 'Blocked at verification'],
  ['decided', 'Decided'],
]

// One status pill for a case, wherever it appears in the picker.
function statusPill(c) {
  if (c.status === 'blocked') return ['p-halt', 'Duplicate']
  if (c.status === 'decided') {
    if (c.decision.outcome !== 'approved') return ['p-high', 'Declined']
    return disbursementOf(c)
      ? ['p-low', 'Paid']
      : ['p-neutral', Math.round(c.decision.pct * 100) + '% approved']
  }
  return [pillClass(c.risk.band), c.risk.band + ' · ' + c.risk.total.toFixed(0)]
}

export default function InvoicePicker({ cases, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const [selCls, selLbl] = statusPill(selected)

  return (
    <div className="picker" ref={root}>
      <button type="button" className="picker-btn" aria-haspopup="listbox" aria-expanded={open}
              onClick={() => setOpen((o) => !o)}>
        <span className="picker-inv">{selected.fields.invoiceNumber}</span>
        <span className="picker-sme">{selected.sme}</span>
        <span className={'pill ' + selCls}>{selLbl}</span>
        <Chevron />
      </button>

      {open && (
        <div className="picker-menu" role="listbox" aria-label="Select an invoice">
          {GROUPS.map(([key, label]) => {
            const rows = cases.filter((c) => c.status === key)
            if (rows.length === 0) return null
            return (
              <div className="picker-group" key={key}>
                <div className="picker-glabel">{label}<span className="cnt">{rows.length}</span></div>
                {rows.map((c) => {
                  const [cls, lbl] = statusPill(c)
                  return (
                    <button key={c.id} type="button" role="option" className="picker-opt"
                            aria-selected={c.id === selected.id}
                            onClick={() => { onSelect(c.id); setOpen(false) }}>
                      <span className="po-l">
                        <span className="po-inv">{c.fields.invoiceNumber} &middot; {c.buyer}</span>
                        <span className="po-sme">{c.sme}</span>
                      </span>
                      <span className="po-r">
                        <span className="po-amt">{fmt(c.fields.amount)}</span>
                        <span className={'pill ' + cls}>{lbl}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
