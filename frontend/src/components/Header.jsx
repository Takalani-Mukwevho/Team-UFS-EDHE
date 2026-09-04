import { NAV_STEPS } from "../data/scenarios";

export default function Header({ active, onNavigate }) {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-md">
      <div className="flex items-center gap-space-sm">
        <div className="hidden xl:flex items-center gap-space-xs px-space-xs py-space-3xs rounded-full bg-surface-container-low">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
        </div>
        <nav className="flex items-center gap-space-xs text-body-sm font-body-sm">
          {NAV_STEPS.map((step, i) => (
            <span key={step.key} className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={() => onNavigate(step.key)}
                className={`px-space-xs py-space-2xs rounded-lg transition-colors ${active === step.key
                    ? "bg-surface-container-high text-on-surface font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                {step.short}
              </button>
              {i < NAV_STEPS.length - 1 && <span className="text-on-surface-variant/40">/</span>}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-space-sm">
        <div className="flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-low">
          <div className="flex flex-col text-right">
            <span className="font-body-sm text-body-sm font-semibold text-on-surface leading-tight">
              ABC Construction (Pty) Ltd
            </span>
            <span className="font-label-caps text-label-caps text-tertiary flex items-center justify-end gap-space-3xs font-semibold">
              KYB VERIFIED <span className="material-symbols-outlined text-[0.75rem]">check_circle</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-body-sm font-bold">
            AC
          </div>
        </div>
      </div>
    </header>
  );
}
