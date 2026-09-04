import { useState } from "react";

/**
 * Secondary detail that a user does not need to make the decision in front of
 * them, but might want to check. Closed by default so the page stays calm.
 */
export default function Details({ label = "Show details", children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="self-start flex items-center gap-space-3xs py-space-3xs text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors"
      >
        <span
          className={`material-symbols-outlined text-[1rem] transition-transform ${open ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
        <span>{open ? "Hide details" : label}</span>
      </button>
      {open && <div className="flex flex-col gap-space-xs pt-space-2xs">{children}</div>}
    </div>
  );
}
